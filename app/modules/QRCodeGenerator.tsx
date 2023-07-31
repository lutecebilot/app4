import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

const QRCodeGenerator = () => {
  const [value, setValue] = useState("");

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter text to generate QR code"
        onChangeText={(text) => setValue(text)}
      />
      <View style={styles.qrCodeContainer}>
        {value ? (
          <QRCode
            value={value}
            size={100}
            color="black"
            backgroundColor="white"
          />
        ) : (
          <QRCode
            value="pierre est un bg"
            size={100}
            color="black"
            backgroundColor="white"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  qrCodeContainer: {
    marginTop: 16,
  },
});

export default QRCodeGenerator;
