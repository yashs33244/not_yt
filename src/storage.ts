import { Storage } from '@google-cloud/storage';
import fs from 'fs';    
import Ffmpeg from 'fluent-ffmpeg';



const storage = new Storage();  

const rawVideoBucketName = "yash_yt_raw_videos";    // must be unique globally  
const processedVideoBucketName = "yash_yt_processed_videos";    // must be unique globally  

const localRawVideoPath = "./raw-videos";  
const localProcessedVideoPath = "./processed-videos";      

export function setupDirectories(){
    ensureDirectoryExists(localRawVideoPath);   
    ensureDirectoryExists(localProcessedVideoPath); 
}
 /**
  * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}
  * @param processedVideoName {@link localProcessedVideoPath}   
  * @returns A promise that resolves to the path of the processed video
  */


export function convertVideo(rawVideoName:String, processedVideoName:String){

    // this function is not returning anything 
    // so we wrap it in a promise to return the path of the processed video
    const inputFilePath = `${localRawVideoPath}/${rawVideoName}`;   
    const outputFilePath = `${localProcessedVideoPath}/${processedVideoName}`;  
    return new Promise<void>((resolve, reject)=>{
        Ffmpeg(inputFilePath)
        .outputOptions("-vf", "scale=-2:360") // 360p
        .on("end", ()=>{        
            console.log("Video processing completed");
            resolve();
        })   
        .on("error", (err)=>{
            console.log("Video processing failed internal server error");
            reject(err);
        })
        .save(outputFilePath);
    })      
}

/**
 * @param filename - the name of the file to download from 
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} directory        
 * @returns A promise that resolves to the path of the downloaded file  
 */

export async function downloadRawVideo(filename:string){
    await storage.bucket(rawVideoBucketName)
        .file(filename)
        .download({destination: `${localRawVideoPath}/${filename}`});     
    
    console.log(
        `gs://${rawVideoBucketName}/${filename} downloaded to ${localRawVideoPath}/${filename}`
    )
}

/**
 * 
 * @param filename -The name of the file to upload from
 * {@link localProcessedVideoPath} directory into the {@link processedVideoBucketName} bucket   
 * @returns A promise that resolves to the path of the uploaded file
 */

export async function uploadProcessedVideo(filename:string){
    const bucket = storage.bucket(processedVideoBucketName);    

    await bucket.upload(`${localProcessedVideoPath}/${filename}`, {
        destination: filename,
    });

    console.log(
        `${localProcessedVideoPath}/${filename} uploaded to gs://${processedVideoBucketName}/${filename}`
    );

    // uploaded video is publically accessible  
    await bucket.file(filename).makePublic();   
} 


/**
 * @param filePath - The path of the file to delete 
 * @returns A promise that resolve that the file has been deleted or not
 */ 

function deleteFile(filePath:string):Promise<void>{
    return new Promise<void>((resolve, reject)=>{  
        if(fs.existsSync(filePath)){
            fs.unlink(filePath, (err)=>{
                if(err){
                    console.log("Error deleting file");
                    reject(err);
                }else{
                    console.log("File deleted");
                    resolve();  
                }
            })
        }else{
            console.log("File does not exist");
            resolve();  
        }
     })
}


/**
 * 
 * @param fileName - The name of the file to delete from 
 * {@link localRawVideoPath} folder
 * @returns A promise that resolves to the path of the deleted file   
 */

export function deleteRawVideo(fileName:string){
    return deleteFile(`${localRawVideoPath}/${fileName}`);  
}

/**
 * 
 * @param fileName - The name of the file to delete from 
 * {@link localProcessedVideoPath} folder
 * @returns A promise that resolves to the path of the deleted file   
 */

export function deleteProcessedVideo(fileName:string){
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);  
}


/**
 * 
 * Ensures that the directory exits, creating it if necessary   
 * @param {string} directoryPath - The path of the directory to ensure exists   
 */

function ensureDirectoryExists(directoryPath:string){
    if(!fs.existsSync(directoryPath)){
        fs.mkdirSync(directoryPath, {recursive: true}); 
        console.log(`Directory created at ${directoryPath}`);   
    }
    
}