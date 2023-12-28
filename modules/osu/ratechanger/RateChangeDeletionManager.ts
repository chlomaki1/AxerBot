// This should delete rate change files after 5 minutes

import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { LoggerClient } from "../../../models/core/LoggerClient";

export interface RateChangeTempFile {
    info: string;
    format: string;
    duration: number;
    files: RateChangeTempFileEntry[];
}

export interface RateChangeTempFileEntry {
    fileId: string;
    createdAt: string;
}

export class RateChangeDeletionManager {
    private tempFilePath = path.resolve(path.join("./temp/ratechange/temp.json"));
    private baseTempPath = path.resolve("./temp/ratechange");
    private logger = new LoggerClient("RateChangeDeletionManager");

    constructor() {}

    private tempFileBase = {
        info: "Files here will be deleted after the time scheduled below",
        format: "{ fileId: string, createdAt: Date }",
        duration: 300,
        files: [],
    };

    private checkAndCreateTempFile() {
        if (!existsSync(this.tempFilePath)) {
            writeFileSync(this.tempFilePath, JSON.stringify(this.tempFileBase));

            this.logger.printSuccess("temp.json created!");
        }
    }

    public addToQueue(fileId: string, createdAt?: Date) {
        const fileContent: RateChangeTempFile = JSON.parse(readFileSync(this.tempFilePath, "utf8"));

        if (fileContent.files.find((file) => file.fileId == fileId)) return;

        fileContent.files.push({
            fileId: fileId.trim(),
            createdAt: (createdAt || new Date()).toISOString(),
        });

        writeFileSync(this.tempFilePath, JSON.stringify(fileContent));

        this.logger.printSuccess(`Added file ${fileId} to deletion queue!`);
    }

    public removeFromQueue(fileId: string) {
        const fileContent: RateChangeTempFile = JSON.parse(readFileSync(this.tempFilePath, "utf8"));

        if (!fileContent.files.find((file) => file.fileId == fileId)) return;

        fileContent.files = fileContent.files.filter((file) => file.fileId != fileId);

        writeFileSync(this.tempFilePath, JSON.stringify(fileContent));

        this.logger.printSuccess(`Removed file ${fileId} from deletion queue!`);
    }

    private getMaxFileAge() {
        const fileContent: RateChangeTempFile = JSON.parse(readFileSync(this.tempFilePath, "utf8"));

        return fileContent.duration;
    }

    private checkTimeDifference(from: Date, to: Date) {
        return (to.getTime() - from.getTime()) / 1000;
    }

    private canDelete(date: Date, maxAge: number) {
        return this.checkTimeDifference(date, new Date()) > maxAge;
    }

    private checkQueue() {
        const fileContent: RateChangeTempFile = JSON.parse(readFileSync(this.tempFilePath, "utf8"));
        const entries = fileContent.files;

        const filesToDelete = entries.filter((entry) =>
            this.canDelete(new Date(entry.createdAt), fileContent.duration)
        );

        for (const file of filesToDelete) {
            try {
                this.logger.printInfo(`Removing ${file.fileId}...`);

                rmSync(path.join(this.baseTempPath, file.fileId), { recursive: true });
                rmSync(path.join(this.baseTempPath, "osz", file.fileId), { recursive: true });

                this.removeFromQueue(file.fileId);

                this.logger.printSuccess(`${file.fileId} removed!`);
            } catch (e: any) {
                if (e.code == "ENOENT") {
                    this.removeFromQueue(file.fileId);
                } else {
                    this.logger.printError(`${file.fileId} can't be removed!`, e);
                }
            }
        }
    }

    public listen() {
        this.logger.printInfo("Starting listener...");

        this.checkAndCreateTempFile();

        setInterval(this.checkQueue.bind(this), 1000);
    }
}
