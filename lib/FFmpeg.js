class FFmpegWrapper {
    static async getFrames(
        localFileName,
        videoURI,
        frameNumber,
        successCallback,
        errorCallback,
    ) {
        const batchSize = 50; // Set the batch size
        let batchIndex = 0;

        const processBatch = async () => {
            const outputImagePath = `${FileSystem.cacheDirectory}/${localFileName}_${batchIndex}_%4d.png`;

            const ffmpegCommand = `-ss 0 -i ${videoURI} -vf "fps=${FRAME_PER_SEC}/1:round=up,scale=${FRAME_WIDTH}:-2" -vframes ${batchSize} -start_number ${batchIndex * batchSize} ${outputImagePath}`;

            try {
                const session = await FFmpegKit.executeAsync(
                    ffmpegCommand,
                    async session => {
                        // Handle session completion
                        if (batchIndex * batchSize >= frameNumber) {
                            // All frames processed
                            console.log('All frames processed successfully.');
                            successCallback();
                            return;
                        }
                        batchIndex++;
                        await processBatch();
                    },
                    errorCallback,
                    log => {
                        console.log(log.getMessage());
                    },
                    statistics => {
                        console.log(statistics);
                    },
                );

                console.log(`Async FFmpeg process started with sessionId ${session.getSessionId()}.`);
            } catch (error) {
                console.error('FFmpeg execution failed:', error);
                errorCallback();
            }
        };

        await processBatch(); // Start processing batches
    }
}

export default FFmpegWrapper;
