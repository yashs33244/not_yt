"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDirectories = setupDirectories;
exports.convertVideo = convertVideo;
exports.downloadRawVideo = downloadRawVideo;
exports.uploadProcessedVideo = uploadProcessedVideo;
exports.deleteRawVideo = deleteRawVideo;
exports.deleteProcessedVideo = deleteProcessedVideo;
const storage_1 = require("@google-cloud/storage");
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const storage = new storage_1.Storage();
const rawVideoBucketName = "yash_yt_raw_videos"; // must be unique globally  
const processedVideoBucketName = "yash_yt_processed_videos"; // must be unique globally  
const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";
function setupDirectories() {
    ensureDirectoryExists(localRawVideoPath);
    ensureDirectoryExists(localProcessedVideoPath);
}
/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}
 * @param processedVideoName {@link localProcessedVideoPath}
 * @returns A promise that resolves to the path of the processed video
 */
function convertVideo(rawVideoName, processedVideoName) {
    // this function is not returning anything 
    // so we wrap it in a promise to return the path of the processed video
    const inputFilePath = `${localRawVideoPath}/${rawVideoName}`;
    const outputFilePath = `${localProcessedVideoPath}/${processedVideoName}`;
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputFilePath)
            .outputOptions("-vf", "scale=-2:360") // 360p
            .on("end", () => {
            console.log("Video processing completed");
            resolve();
        })
            .on("error", (err) => {
            console.log("Video processing failed internal server error");
            reject(err);
        })
            .save(outputFilePath);
    });
}
/**
 * @param filename - the name of the file to download from
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} directory
 * @returns A promise that resolves to the path of the downloaded file
 */
function downloadRawVideo(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        yield storage.bucket(rawVideoBucketName)
            .file(filename)
            .download({ destination: `${localRawVideoPath}/${filename}` });
        console.log(`gs://${rawVideoBucketName}/${filename} downloaded to ${localRawVideoPath}/${filename}`);
    });
}
/**
 *
 * @param filename -The name of the file to upload from
 * {@link localProcessedVideoPath} directory into the {@link processedVideoBucketName} bucket
 * @returns A promise that resolves to the path of the uploaded file
 */
function uploadProcessedVideo(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const bucket = storage.bucket(processedVideoBucketName);
        yield bucket.upload(`${localProcessedVideoPath}/${filename}`, {
            destination: filename,
        });
        console.log(`${localProcessedVideoPath}/${filename} uploaded to gs://${processedVideoBucketName}/${filename}`);
        // uploaded video is publically accessible  
        yield bucket.file(filename).makePublic();
    });
}
/**
 * @param filePath - The path of the file to delete
 * @returns A promise that resolve that the file has been deleted or not
 */
function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.log("Error deleting file");
                    reject(err);
                }
                else {
                    console.log("File deleted");
                    resolve();
                }
            });
        }
        else {
            console.log("File does not exist");
            resolve();
        }
    });
}
/**
 *
 * @param fileName - The name of the file to delete from
 * {@link localRawVideoPath} folder
 * @returns A promise that resolves to the path of the deleted file
 */
function deleteRawVideo(fileName) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}
/**
 *
 * @param fileName - The name of the file to delete from
 * {@link localProcessedVideoPath} folder
 * @returns A promise that resolves to the path of the deleted file
 */
function deleteProcessedVideo(fileName) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}
/**
 *
 * Ensures that the directory exits, creating it if necessary
 * @param {string} directoryPath - The path of the directory to ensure exists
 */
function ensureDirectoryExists(directoryPath) {
    if (!fs_1.default.existsSync(directoryPath)) {
        fs_1.default.mkdirSync(directoryPath, { recursive: true });
        console.log(`Directory created at ${directoryPath}`);
    }
}
