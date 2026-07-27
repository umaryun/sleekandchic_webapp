import { supabaseAdmin } from "../supabase";

export async function setupStorageBuckets() {
  const buckets = ["products", "categories", "banners"];

  for (const bucketName of buckets) {
    const { data: existing, error: getError } = await supabaseAdmin.storage.getBucket(bucketName);

    if (getError || !existing) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
      });

      if (createError) {
        console.error(`Failed to create bucket ${bucketName}:`, createError);
      } else {
        console.log(`Successfully created bucket: ${bucketName}`);
      }
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }
  }
}

if (require.main === module) {
  setupStorageBuckets()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
