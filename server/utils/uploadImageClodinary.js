import { v2 as cloudinary } from 'cloudinary';

// Check if Cloudinary credentials are configured
if (!process.env.CLODINARY_CLOUD_NAME || !process.env.CLODINARY_API_KEY || !process.env.CLODINARY_API_SECRET_KEY) {
    console.error('⚠️  WARNING: Cloudinary credentials not configured!');
    console.error('   Please set CLODINARY_CLOUD_NAME, CLODINARY_API_KEY, and CLODINARY_API_SECRET_KEY in server/.env');
}

cloudinary.config({
    cloud_name : process.env.CLODINARY_CLOUD_NAME,
    api_key : process.env.CLODINARY_API_KEY,
    api_secret : process.env.CLODINARY_API_SECRET_KEY
})

const uploadImageClodinary = async(image)=>{
    try {
        // Validate input
        if (!image) {
            throw new Error('No image provided');
        }

        const buffer = image?.buffer || Buffer.from(await image.arrayBuffer())

        if (!buffer || buffer.length === 0) {
            throw new Error('Invalid image buffer');
        }

        // Upload to Cloudinary with proper error handling
        const uploadImage = await new Promise((resolve, reject)=>{
            cloudinary.uploader.upload_stream(
                { folder : "quickart" },
                (error, uploadResult)=>{
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return reject(error);
                    }
                    if (!uploadResult) {
                        return reject(new Error('Cloudinary returned no result'));
                    }
                    return resolve(uploadResult);
                }
            ).end(buffer)
        })

        console.log('✅ Image uploaded to Cloudinary:', uploadImage.url);
        return uploadImage;

    } catch (error) {
        console.error('❌ uploadImageClodinary error:', error.message);
        throw error;
    }
}

export default uploadImageClodinary
