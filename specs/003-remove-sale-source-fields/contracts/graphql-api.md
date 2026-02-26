# Contract: GraphQL API (Remove Sale Source Fields)

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

## Query: delayedSales

- Same shape as `salesList` with delay/overdue filter behavior enforced by server.

## Query: saleById

- **Inputs**
  - `id: ID!`
- **Output**
  - `Sale` with nested `listing`, `comments`, `tags`, and `filledBy` user details

## Query: listUsersForAssignment

- **Output**
  - `id`, `fullName`

## Query: tags

- **Inputs**
  - `search?: String`
  - `limit?: Int`
- **Output**
  - `DashboardTag[]`

## Mutation: updateSaleStatus

- `id: ID!`
- `status: SaleStatus!`
- `expected_updated_at: DateTime`
- Returns: `Sale`

## Mutation: updateSaleDelay

- `id: ID!`
- `delivery_delay_at: DateTime`
- `expected_updated_at: DateTime`
- Returns: `Sale`

## Mutation: updateSaleProblem

- `id: ID!`
- `problem_reason: String`
- `expected_updated_at: DateTime`
- Returns: `Sale`

## Mutation: setSaleFilledBy

- `id: ID!`
- `user_id: ID!`
- Returns: `Sale`

## Mutation: addSaleTag

- `id: ID!`
- `tag_name: String!`
- Returns: `Sale`

## Mutation: removeSaleTag

- `id: ID!`
- `tag_name: String!`
- Returns: `Sale`

## Mutation: addSaleComment

- `id: ID!`
- `comment: String!`
- Returns: `SaleComment`

## Types

### Sale

- `id: ID!`
- `listing: Listing`
- `buyerEmail: String`
- `status: SaleStatus!`
- `deliveryDelayAt: DateTime`
- `problemReason: String`
- `filledBy: User`
- `dashboardTags: [DashboardTag!]!`
- `comments: [SaleComment!]!`
- `createdAt: DateTime!`
- `updatedAt: DateTime!`

### Listing

- `id: ID!`
- `sourceListingId: String!`
- `listingId: String`
- `adviceIndex: Int`
- `area: String`
- `assignedPos: String`
- `creationDate: DateTime`
- `creationType: String`
- `eventId: String`
- `eventName: String`
- `exchange: String`
- `exchangesForSale: [String!]!`
- `extraFee: Float`
- `faceValue: Float`
- `lastPosModificationDate: DateTime`
- `lowerPrice: Float`
- `offerId: String`
- `originalSection: String`
- `placesIds: [String!]!`
- `price: Float`
- `priceMultiplier: Float`
- `pricingRuleMultiplierChangeTime: DateTime`
- `quality: Float`
- `quantity: Int`
- `row: String`
- `rulePriceMultiplierIndex: Int`
- `section: String`
- `splitRule: String`
- `startRow: String`
- `status: String`
- `statusChangeDate: DateTime`
- `subPlatform: String`
- `tags: [String!]!`
- `ticketTypeName: String`
- `venueName: String`
- `fees: [ListingFee!]`
- `createdAt: DateTime!`
- `updatedAt: DateTime!`

### SaleComment

- `id: ID!`
- `author: String!`
- `comment: String!`
- `createdAt: DateTime!`

### User

- `id: ID!`
- `authSub: String`
- `firstName: String`
- `lastName: String`
- `fullName: String!`

### DashboardTag

- `id: ID!`
- `name: String!`

### ListingFee

- `type: String`
- `description: String`
- `amount: Float`

### Mutations and inputs

- `SaleStatus`: `RECEIVED | COMPLETED | DELAYED | PROBLEM`
- `PaginationInput`, `SaleFilterInput`, `SaleSortInput`, `SaleSortField`, `SortDirection` are unchanged.

### Contract Constraint

- `externalSaleId` and `sourcePayload` are not members of `Sale`, `Listing`, or any mutation payloads returned to clients.
