# Contract: GraphQL API (Sales Operations Dashboard)

## Query: salesList

- **Inputs**
  - `filter`: object
    - `status?: SaleStatus`
    - `tagIds?: [ID!]`
    - `has_delay?: Boolean`
    - `overdue_only?: Boolean`
    - `search?: String`
  - `sort?: { field: SaleSortField!, direction: SortDirection! }`
  - `pagination?: { skip: Int = 0, limit: Int = 50 }`
- **Output**
  - `items: [Sale]`
  - `totalCount: Int`

## Query: saleById

- **Inputs**
  - `id: ID!`
- **Output**
  - `Sale` with nested `comments`, `tags`, and `filledBy` user details

## Query: delayedSales (optional convenience)

- Mirrors `salesList` with enforced delay predicate.

## Mutation: updateSaleStatus

- `id: ID!`
- `status: SaleStatus!`
- `expected_updated_at: DateTime` (optional optimistic concurrency token)
- Returns `Sale`

## Mutation: updateSaleDelay

- `id: ID!`
- `delivery_delay_at: DateTime`
- `expected_updated_at: DateTime` (optional optimistic concurrency token)
- Returns `Sale`

## Mutation: updateSaleProblem

- `id: ID!`
- `problem_reason: String`
- `expected_updated_at: DateTime` (optional optimistic concurrency token)
- Returns `Sale`

## Mutation: setSaleFilledBy

- `id: ID!`
- `user_id: ID`
- Returns `Sale`

## Mutation: addSaleTag

- `id: ID!`
- `tag_name: String!`
- Returns `Sale`

## Mutation: removeSaleTag

- `id: ID!`
- `tag_name: String!`
- Returns `Sale`

## Mutation: addSaleComment

- `id: ID!`
- `comment: String!`
- Returns `SaleComment`

## Types

- `Sale`
  - read-only source fields: `externalSaleId`, `listingId`, `eventId`, `quantity`, `price`, `currency`, `buyerEmail`, `sourcePayload`
  - operational fields: `status`, `deliveryDelayAt`, `problemReason`, `filledBy`, `tags`, `comments`, `createdAt`, `updatedAt`

- `SaleTag`
  - `id`, `name`

- `SaleComment`
  - `id`, `author`, `comment`, `createdAt`

- `SaleStatus`
  - `RECEIVED`, `COMPLETED`, `DELAYED`, `PROBLEM`
