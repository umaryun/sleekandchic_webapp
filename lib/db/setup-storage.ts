import { getSupabaseAdmin } from "../supabase";

// Storage enforces these on every upload. SVG is excluded because it can carry scripts.
const BUCKET_OPTIONS = {
  public: true,
  fileSizeLimit: 5242880, // 5MB limit
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
};

export async function setupStorageBuckets() {
  const supabaseAdmin = getSupabaseAdmin();
  const buckets = ["products", "categories", "banners"];

  for (const bucketName of buckets) {
    const { data: existing, error: getError } = await supabaseAdmin.storage.getBucket(bucketName);

    if (getError || !existing) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, BUCKET_OPTIONS);

      if (createError) {
        console.error(`Failed to create bucket ${bucketName}:`, createError);
      } else {
        console.log(`Successfully created bucket: ${bucketName}`);
      }
    } else {
      // Brings buckets created by an older version of this script up to date.
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, BUCKET_OPTIONS);
      if (updateError) {
        console.error(`Failed to update bucket ${bucketName}:`, updateError);
      } else {
        console.log(`Updated bucket settings: ${bucketName}`);
      }
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
