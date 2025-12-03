-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "toAccountId" TEXT,
ADD COLUMN     "toAmount" INTEGER,
ADD COLUMN     "toCurrency" TEXT,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
