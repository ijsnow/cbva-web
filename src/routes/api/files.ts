import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { db } from "@/db/connection"
import { files } from "@/db/schema/files"

export const Route = createFileRoute("/api/files")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url)
        const id = url.searchParams.get("id")

        if (!id) {
          return new Response("Missing id parameter", { status: 400 })
        }

        const fileId = Number.parseInt(id, 10)
        if (Number.isNaN(fileId)) {
          return new Response("Invalid id parameter", { status: 400 })
        }

        const result = await db
          .select({
            bytes: files.bytes,
          })
          .from(files)
          .where(eq(files.id, fileId))

        if (result.length === 0) {
          return new Response("File not found", { status: 404 })
        }

        const file = result[0]

        return new Response(file.bytes, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=31536000",
          },
        })
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const formData = await request.formData()
          const imageFile = formData.get("file")

          if (!imageFile || !(imageFile instanceof File)) {
            return new Response("Missing or invalid image file", {
              status: 400,
            })
          }

          const arrayBuffer = await imageFile.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          const result = await db
            .insert(files)
            .values({
              bytes: buffer,
            })
            .returning({ id: files.id })

          return new Response(
            JSON.stringify({
              success: true,
              id: result[0].id,
              message: "File uploaded successfully",
            }),
            {
              status: 201,
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        } catch (error) {
          console.error("Error uploading file:", error)

          return new Response(
            JSON.stringify({
              success: false,
              message: "Failed to upload file",
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        }
      },
    },
  },
})
