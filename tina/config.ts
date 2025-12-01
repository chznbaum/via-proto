import { defineConfig } from "tinacms";

// Branch detection - check env vars or default to main
const branch =
  process.env.TINA_BRANCH ||
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get these from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "post",
        label: "Blog Posts",
        path: "content/posts",
        format: "mdx",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return `${values?.title?.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "")}`;
            },
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            description: "A short description for post previews",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "datetime",
            name: "date",
            label: "Publish Date",
            required: true,
          },
          {
            type: "image",
            name: "coverImage",
            label: "Cover Image",
          },
          {
            type: "object",
            name: "author",
            label: "Author",
            fields: [
              {
                type: "string",
                name: "name",
                label: "Name",
              },
              {
                type: "image",
                name: "avatar",
                label: "Avatar",
              },
            ],
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
    ],
  },
});
