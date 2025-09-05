-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "lensSizes" TEXT[] DEFAULT ARRAY[]::TEXT[];
