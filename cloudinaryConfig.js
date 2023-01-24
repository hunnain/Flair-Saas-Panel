const cloudinary = require('cloudinary');
cloudinary.config({
cloud_name: 'dg8ikrdpa',
api_key: '979777468463349',
api_secret: 'TwiqoM8Bm3gIsFZ1pPTb_5U0t7s'
});


exports.uploads = (file) =>{
    return new Promise(resolve => {
    cloudinary.uploader.upload(file, (result) =>{
    resolve({url: result.url, id: result.public_id})
    }, {resource_type: "auto"})
    })
}