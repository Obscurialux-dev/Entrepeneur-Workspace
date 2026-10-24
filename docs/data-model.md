# Data Model: Firestore

Dokumen ini adalah rancangan awal. Sebelum menulis rules dan fungsi produksi, tentukan field final, validasi, index, retensi, dan relasi yang benar-benar dibutuhkan.

## 1. Konvensi

- Gunakan ID dokumen yang tidak mudah ditebak untuk dokumen internal.
- Gunakan `createdAt` dan `updatedAt` bertipe Firestore Timestamp.
- Untuk catatan sensitif, simpan `createdBy`, `updatedBy`, atau `verifiedBy`.
- Gunakan integer dalam satuan rupiah untuk nilai uang IDR. Jangan memakai floating point untuk nominal uang.
- Simpan snapshot nilai historis di transaksi.
- Jangan menyimpan data pribadi yang tidak diperlukan.
- Jangan menaruh bukti pembayaran atau data sensitif pada URL publik.

## 2. Koleksi

### `users/{uid}`
Field awal:
- `displayName`
- `email`
- `role`: `entrepreneur_admin | research | marketing | executive_viewer`
- `active`
- `createdAt`
- `updatedAt`

Role harus ditetapkan melalui proses admin tepercaya, bukan diubah bebas dari client.

### `products/{productId}`
- `name`
- `sku`
- `category`
- `description`
- `sellingPriceIdr`
- `hppIdr`
- `trackInventory`
- `status`: `research | approved | active | archived`
- `imagePaths`
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

Varian dapat berupa subcollection `products/{productId}/variants/{variantId}`:
- `name` (misalnya ukuran L)
- `sku`
- `sellingPriceOverrideIdr` (opsional)
- `hppOverrideIdr` (opsional)
- `active`
- `createdAt`, `updatedAt`

> Catatan implementasi prototipe (T020): varian disimpan sebagai array `variants` di dalam dokumen
> produk pada `.data/products.json`. Saat Firestore diaktifkan, pindahkan ke subcollection
> `products/{productId}/variants/{variantId}` tanpa mengubah kontrak repository, validasi, atau UI.

### `vendors/{vendorId}`
- `name`
- `contactName` (opsional)
- `phone` (opsional)
- `email` (opsional)
- `location` (opsional)
- `minimumOrderQuantity`
- `leadTimeDays`
- `notes`
- `createdAt`, `updatedAt`

### `researchProjects/{projectId}`
- `title`
- `type`: `product | market | competitor | other`
- `status`
- `ownerUid`
- `collaboratorUids`
- `targetMarket`
- `hypothesis`
- `findings`
- `recommendation`
- `relatedProductIds`
- `vendorIds`
- `dueAt`
- `createdAt`, `updatedAt`

### `researchReports/{reportId}`
- `projectId`
- `title`
- `summary`
- `sourceLinks`
- `attachmentPaths`
- `conclusion`
- `createdBy`
- `createdAt`, `updatedAt`

### `contentItems/{contentId}`
- `title`
- `type`: `educational | promotional | campaign`
- `ownerSubdivision`: `research | marketing`
- `status`
- `topic`
- `caption`
- `referenceLinks`
- `assetPaths`
- `canvaUrl` (opsional)
- `productIds`
- `campaignId` (opsional)
- `assignedToUid`
- `plannedPublishAt`
- `publishedAt`
- `instagramPostUrl`
- `createdAt`, `updatedAt`

### `campaigns/{campaignId}`
- `name`
- `objective`
- `productIds`
- `startAt`
- `endAt`
- `status`
- `ownerUid`
- `notes`
- `createdAt`, `updatedAt`

### `poCampaigns/{poCampaignId}`
- `slug`
- `title`
- `description`
- `productId`
- `variantIds`
- `opensAt`
- `closesAt`
- `status`
- `maxOrders` (opsional)
- `stockPolicy`: `unlimited | reserve_available | made_to_order`
- `paymentInstructions`
- `publicFields`
- `createdBy`
- `createdAt`, `updatedAt`

Slug harus unik. Jangan mengekspos data internal melalui dokumen campaign publik; gunakan DTO/endpoint publik yang hanya mengembalikan field yang diperlukan.

### `orders/{orderId}`
- `orderNumber`
- `poCampaignId`
- `customerName`
- `customerStudentId` (opsional jika memang dibutuhkan)
- `customerContact`
- `items`: array snapshot `{productId, variantId, productName, variantName, quantity, unitPriceIdr, unitHppIdr, lineTotalIdr}`
- `subtotalIdr`
- `totalIdr`
- `paymentStatus`
- `fulfillmentStatus`
- `paymentProofPath` (opsional; akses harus dibatasi)
- `idempotencyKeyHash`
- `createdAt`, `updatedAt`
- `verifiedBy`, `verifiedAt` (opsional)

Jangan pernah mempercayai harga/total dari browser. Backend menghitung ulang semuanya.

### `payments/{paymentId}`
- `orderId`
- `amountIdr`
- `method`
- `status`
- `proofPath` (opsional)
- `verifiedBy`
- `verifiedAt`
- `createdAt`, `updatedAt`

### `inventoryMovements/{movementId}`
- `productId`
- `variantId`
- `quantityDelta`
- `reason`
- `orderId` (opsional)
- `createdBy`
- `createdAt`
- `notes`

Untuk implementasi stok, tentukan apakah jumlah stok disimpan pada dokumen varian atau dokumen inventori khusus. Perubahan stok harus atomik dan menghasilkan movement record yang sesuai.

### `transactions/{transactionId}`
- `type`: `sale | cogs | expense | refund | other`
- `category`
- `amountIdr`
- `orderId` (opsional)
- `productId` (opsional)
- `occurredAt`
- `description`
- `createdBy`
- `createdAt`

Jangan mencatat pendapatan kas hanya karena order dibuat. Tetapkan aturan kapan transaksi pendapatan, HPP, dan kas dicatat.

### `tasks/{taskId}`
- `title`
- `description`
- `subdivision`: `research | marketing | shared`
- `ownerUid`
- `assigneeUids`
- `status`
- `priority`
- `startAt`
- `dueAt`
- `checklist`
- `relatedContentId` (opsional)
- `relatedProjectId` (opsional)
- `createdAt`, `updatedAt`

### `events/{eventId}`
- `title`
- `description`
- `startAt`
- `endAt`
- `timezone`
- `ownerUid`
- `attendeeUids`
- `calendarScope`: `team | personal`
- `relatedTaskId` (opsional)
- `createdAt`, `updatedAt`

### `calendarConnections/{connectionId}`
- `uid`
- `provider`: `google`
- `calendarId`
- `status`
- `grantedScopes`
- `createdAt`, `updatedAt`

Token OAuth harus disimpan hanya pada backend dengan perlindungan yang memadai. Jangan kirim refresh token ke browser atau simpan di dokumen yang dapat dibaca pengguna umum.

### `calendarSyncJobs/{jobId}`
- `eventId`
- `uid`
- `targetCalendarId`
- `externalEventId`
- `operation`
- `status`
- `attemptCount`
- `lastErrorCode` (tanpa secret)
- `lastAttemptAt`
- `syncedAt`
- `createdAt`, `updatedAt`

### `auditLogs/{logId}`
- `actorUid`
- `action`
- `entityType`
- `entityId`
- `timestamp`
- `metadata` (hindari menyimpan data sensitif berlebihan)

## 3. Indeks dan query

Tambahkan indeks berdasarkan query nyata, misalnya:
- Orders berdasarkan `poCampaignId` + `createdAt`.
- Orders berdasarkan `paymentStatus` + `createdAt`.
- Tasks berdasarkan `assigneeUids`/assignee model yang dipilih + `status` + `dueAt`.
- Events berdasarkan `startAt`.
- Content berdasarkan `status` + `plannedPublishAt`.

Jangan menebak sintaks indeks sebelum query final ditulis. Jalankan emulator/test dan tambahkan indeks yang diminta Firestore.

## 4. Retensi dan privasi

Tentukan kebutuhan retensi data pemesan sebelum peluncuran. Kumpulkan data minimal yang dibutuhkan untuk memenuhi pesanan dan laporan. Akses ke kontak dan bukti pembayaran harus dibatasi.
