import React from "react";
import { IonIcon, IonText } from "@ionic/react";
import { useIntl } from "react-intl";
import { sadOutline } from "ionicons/icons";

import styles from "./style.module.css";

const EmptyContacts: React.FC = () => {
  const intl = useIntl();
  return (
    <div className={styles["empty-contacts"]}>
      <IonIcon size="large" icon={sadOutline} />
      <IonText className="ion-padding ion-margin-bottom">
        {intl.formatMessage({ id: "app.group-chat.no-member-to-add" })}
      </IonText>
    </div>
  );
};

export default EmptyContacts;
