#!/bin/bash
cd "$(dirname "$0")"
npx prisma migrate dev --name add_category_image_and_position
