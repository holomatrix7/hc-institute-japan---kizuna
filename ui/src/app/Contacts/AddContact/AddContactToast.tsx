import { IonToast } from "@ionic/react";
import React from "react";
import { useIntl } from "react-intl";

interface Props {
  toast: null | string;
  onDismiss(): any;
}

const AddContactToast: React.FC<Props> = ({ toast, onDismiss }) => {
  const intl = useIntl();
  return (
    <IonToast
      isOpen={toast !== null}
      onDidDismiss={onDismiss}
      message={intl.formatMessage(
        { id: "app.contacts.add-message" },
        { name: toast }
      )}
      duration={1000}
      color="light"
    />
  );
};

export default AddContactToast;
