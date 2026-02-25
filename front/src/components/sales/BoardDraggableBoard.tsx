import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import type { Sale, SaleStatus } from '@/generated/graphql';
import { SALE_STALE_EDIT_WARNING } from '@/store/sales/sale-detail.mutations';
import { SALE_BOARD_COLUMNS, SALE_BOARD_LABELS } from '@/app/dashboard/sales/status';
import { isValidStatusTransition } from '@/lib/sales/status';
import { useSalesBoardStore } from '@/store/sales/sales-board.store';
import { saleDisplayLabel } from '@/lib/sales/sales-utils';

type BoardDraggableBoardProps = {
  sales: Sale[];
  onWarning?: (message: string | null) => void;
};

type SaleCardProps = {
  sale: Sale;
};

type BoardColumnProps = {
  status: SaleStatus;
  children: ReactNode;
  isOver: boolean;
};

const formatDelay = (value: string | null | undefined): string => {
  if (!value) {
    return 'No Delay';
  }

  return new Date(value).toLocaleString();
};

const BoardCard = ({ sale }: SaleCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sale.id,
    data: {
      saleId: sale.id,
      status: sale.status,
    },
  });

  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  return (
    <li className="sales-board-card" ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <strong className="text-sm text-slate-900">{sale.externalSaleId}</strong>
      <p className="mt-1 text-sm text-slate-700">{saleDisplayLabel(sale)}</p>
      <p className="mt-1 text-xs text-slate-500">Delay: {formatDelay(sale.deliveryDelayAt)}</p>
      <p className="mt-1 text-xs text-slate-500">Problem: {sale.problemReason || '—'}</p>
      <Link
        className="mt-3 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900"
        to={`/dashboard/sale/${sale.id}`}
      >
        Open
      </Link>
    </li>
  );
};

const BoardColumn = ({ status, children, isOver }: BoardColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <section
      key={status}
      ref={setNodeRef}
      className={`sales-board-column ${isOver ? 'sales-board-column-over' : ''}`}
    >
      <h3 className="sales-board-title">{SALE_BOARD_LABELS[status] || status}</h3>
      <ul className="mt-3 grid gap-2">{children}</ul>
    </section>
  );
};

export const BoardDraggableBoard = ({ sales, onWarning }: BoardDraggableBoardProps) => {
  const { moveSaleStatus } = useSalesBoardStore();
  const [localSales, setLocalSales] = useState<Sale[]>(sales);
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [droppableStatuses, setDroppableStatuses] = useState<Record<string, boolean>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const activeSale = localSales.find(sale => sale.id === activeSaleId) ?? null;

  useEffect(() => {
    setLocalSales(sales);
  }, [sales]);

  const salesByStatus = useMemo(
    () =>
      SALE_BOARD_COLUMNS.reduce<Record<SaleStatus, Sale[]>>((acc, status) => {
        acc[status] = localSales.filter(item => item.status === status);
        return acc;
      }, {} as Record<SaleStatus, Sale[]>),
    [localSales],
  );

  const setWarning = (message: string | null) => {
    setWarningMessage(message);
    onWarning?.(message);
  };

  const resolveTargetStatus = (overId: string | null): SaleStatus | null => {
    if (!overId) {
      return null;
    }

    if (SALE_BOARD_COLUMNS.includes(overId as SaleStatus)) {
      return overId as SaleStatus;
    }

    const overSale = localSales.find(item => item.id === overId);
    return overSale?.status ?? null;
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveSaleId(active.id.toString());
    setDroppableStatuses({});
    setWarning(null);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    if (!over) {
      setDroppableStatuses({});
      return;
    }

    const overStatus = resolveTargetStatus(over.id.toString());

    if (!overStatus) {
      setDroppableStatuses({});
      return;
    }

    setDroppableStatuses({
      [overStatus]: true,
    });
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveSaleId(null);
    setDroppableStatuses({});

    if (!over) {
      return;
    }

    const saleId = active.id.toString();
    const targetStatus = resolveTargetStatus(over.id.toString());
    const found = localSales.find(sale => sale.id === saleId);

    if (!found || !targetStatus) {
      return;
    }

    if (found.status === targetStatus) {
      return;
    }

    if (!isValidStatusTransition(found.status, targetStatus)) {
      setWarning(`Move blocked: ${found.status} cannot transition to ${targetStatus}.`);
      return;
    }

    const baseline = found.updatedAt;
    const previousSales = localSales;
    const expectedUpdatedAt = baseline;

    setLocalSales(current =>
      current.map(item => (item.id === saleId ? { ...item, status: targetStatus } : item)),
    );

    try {
      const response = await moveSaleStatus({ id: saleId, status: targetStatus, expectedUpdatedAt });

      setLocalSales(current =>
        current.map(item => (item.id === saleId ? (response.sale as Sale) : item)),
      );
      setWarning(null);
    } catch (error) {
      setLocalSales(previousSales);
      const message =
        error instanceof Error && error.message === SALE_STALE_EDIT_WARNING
          ? SALE_STALE_EDIT_WARNING
          : 'Unable to move sale to the selected status.';
      setWarning(message);
    }
  };

  const overlay = activeSale ? (
    <div className="sales-board-card sales-board-card-overlay">Moving {activeSale.externalSaleId}</div>
  ) : null;

  return (
    <div className="space-y-4">
      {warningMessage ? <p className="text-sm text-amber-700">{warningMessage}</p> : null}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className="sales-board-grid">
          {SALE_BOARD_COLUMNS.map(status => (
            <BoardColumn key={status} status={status} isOver={Boolean(droppableStatuses[status])}>
              {salesByStatus[status]?.length === 0 ? (
                <li key={`${status}-empty`} className="text-sm text-slate-500">
                  No items
                </li>
              ) : (
                salesByStatus[status].map(sale => <BoardCard key={sale.id} sale={sale} />)
              )}
            </BoardColumn>
          ))}
        </div>
        <DragOverlay>{overlay}</DragOverlay>
      </DndContext>
    </div>
  );
};
