import { IonChip, IonIcon, IonLabel, IonRow } from "@ionic/react";
import { closeCircle } from "ionicons/icons";
import React, { Dispatch, SetStateAction } from "react";
import styles from "./style.module.css";

interface Props {
  files: any[];
  setFiles: Dispatch<SetStateAction<any[]>>;
  file: HTMLInputElement | null;
}
const FileView: React.FC<Props> = ({ file, files, setFiles }) => {
  const handleClose = (index: number) => {
    (file as HTMLInputElement).value = "";
    setFiles((currFiles) => {
      currFiles.splice(index, 1);
      return [...currFiles];
    });
  };
  const decoder = new TextDecoder();

  const getThumbnail = (type: string, thumbnail: Uint8Array) => {
    if (type === "IMAGE") return decoder.decode(thumbnail);
    else
      return URL.createObjectURL(new Blob([thumbnail], { type: "image/jpeg" }));
  };
  return (
    <IonRow className={styles.row}>
      {files.map((file, index) => {
        return (
          <IonChip
            {...(file.fileType.type === "IMAGE" ||
            file.fileType.type === "VIDEO"
              ? {
                  style: {
                    backgroundImage: `url(${getThumbnail(
                      file.fileType.type,
                      file.fileType.payload.thumbnail
                    )})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  },
                }
              : {})}
            className={styles.chip}
            key={index}
          >
            {file.fileType.type === "IMAGE" ||
            file.fileType.type === "VIDEO" ? null : (
              <IonLabel>{file.metadata.fileName}</IonLabel>
            )}
            <IonIcon icon={closeCircle} onClick={() => handleClose(index)} />
          </IonChip>
        );
      })}
    </IonRow>
  );
};

export default FileView;
