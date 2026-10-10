ALTER TABLE "Experience"
ADD COLUMN "slug" TEXT,
ADD COLUMN "summary" TEXT;

WITH "experience_slugs" AS (
    SELECT
        "id",
        NULLIF(
            TRIM(
                BOTH '-' FROM LOWER(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE("role" || '-' || "company", '[^A-Za-z0-9]+', '-', 'g'),
                        '(^-+|-+$)',
                        '',
                        'g'
                    )
                )
            ),
            ''
        ) AS "baseSlug"
    FROM "Experience"
)
UPDATE "Experience" AS experience
SET "slug" = COALESCE(
    NULLIF(TRIM(BOTH '-' FROM LEFT(COALESCE(experience_slugs."baseSlug", 'experience'), 80)), ''),
    'experience'
) || '-' || ENCODE(CONVERT_TO(experience."id", 'UTF8'), 'hex')
FROM "experience_slugs"
WHERE experience."id" = experience_slugs."id";

ALTER TABLE "Experience"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Experience_slug_key" ON "Experience"("slug");

CREATE TABLE "_ExperienceToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ExperienceToProject_AB_unique"
ON "_ExperienceToProject"("A", "B");

CREATE INDEX "_ExperienceToProject_B_index"
ON "_ExperienceToProject"("B");

ALTER TABLE "_ExperienceToProject"
ADD CONSTRAINT "_ExperienceToProject_A_fkey"
FOREIGN KEY ("A") REFERENCES "Experience"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ExperienceToProject"
ADD CONSTRAINT "_ExperienceToProject_B_fkey"
FOREIGN KEY ("B") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "_ExperienceToTechnology" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ExperienceToTechnology_AB_unique"
ON "_ExperienceToTechnology"("A", "B");

CREATE INDEX "_ExperienceToTechnology_B_index"
ON "_ExperienceToTechnology"("B");

ALTER TABLE "_ExperienceToTechnology"
ADD CONSTRAINT "_ExperienceToTechnology_A_fkey"
FOREIGN KEY ("A") REFERENCES "Experience"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ExperienceToTechnology"
ADD CONSTRAINT "_ExperienceToTechnology_B_fkey"
FOREIGN KEY ("B") REFERENCES "Technology"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
