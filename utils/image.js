const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
require('dotenv').config()
const uploadImage = async(image,name)=>{
    try{
        const allowedExt = ['image/jpg','image/jpeg','image/png','image/webp','image/svg']

        const mimetype = image.split(';')[0].split(':')[1]

        if(!allowedExt.includes(mimetype)){
            throw new UserInputError("File Type Not Supported!")
        }
        // image data as base64 
        const image_data_as_base64 = image.replace(/^data:image\/\w+;base64,/,'')

        // // image buffer 
        const decoded_image = Buffer.from(image_data_as_base64,'base64')

        // // optimized image buffer converted to webp 
        const optimized_image = await sharp(decoded_image).webp().toBuffer()
        
        const img_path = path.dirname(require.main.filename) + `/uploads/${name}.webp`
        fs.writeFileSync(img_path,optimized_image)
        //  fs.unlinkSync(img_path)
        return `${process.env.APP_URL}/uploads/${name}.webp`

    }catch(err){
        throw new Error(err)
    }
}
const deleteImage = async(name)=>{
    try{  
        const img_path = path.dirname(require.main.filename) + `/uploads/${name}.webp`
        // delete image form folder path using image name 
        fs.unlinkSync(img_path)
        return "Image Deleted Successfully!"
    }catch (err) {
        throw new Error(err);
    }
}
module.exports = {uploadImage,deleteImage}