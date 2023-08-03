import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, Modal,Switch, TouchableOpacity, Dimensions, TextInput } from "react-native";
import { Camera } from "expo-camera";
import { FIREBASE_AUTH, FIREBASE_DATABASE } from "../../firebaseconfig";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import firebase from "firebase/compat";

const QRCodeScannerSortie = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [qrData, setQRData] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [isQRCodeValidated, setIsQRCodeValidated] = useState(false);
  const [Reserved, setReserved] = useState(false);
  const [StockComplet, setStockComplet] = useState(false);
  const [StockIncomplet, setStockIncomplet] = useState(false);
  const [incomplet, setIncomplet] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [StockIncompletAvant, setStockIncompletAvant]=useState(false);
  const [Réservéavant, setRéservéavant]=useState(false);
  const [StockCompletAvant, setStockCompletAvant]=useState(false);
  const [Parti, setParti] = useState(false);


  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const updatestock = async (result) => {
    const referenceParts = result.data.split("_");
    const id = referenceParts[0].trim();
    console.log('id',id);
    const user = FIREBASE_AUTH.currentUser;
    const userId = user.uid;
    const userDocRef = doc(FIREBASE_DATABASE, 'Utilisateur', userId);
    const userDocSnapshot = await getDoc(userDocRef);
    const ville = userDocSnapshot.data().pays;
    const lieu = userDocSnapshot.data().entrepot;
    const qresult=result.data;
    const referenceDocRef = doc(FIREBASE_DATABASE, 'Pays', ville, lieu+'Effectif', referenceParts[0],"id",qresult);
    console.log('Pays', ville, lieu+'Effectif', referenceParts[0], 'id', result.data);
    const referenceDocSnapshot = await getDoc(referenceDocRef);
    console.log(referenceDocSnapshot.data());
    if (referenceDocSnapshot && referenceDocSnapshot.exists()) {
      setStockIncomplet(referenceDocSnapshot.data().StockIncomplet);
      setReserved(referenceDocSnapshot.data().Réservé);
      setStockComplet(referenceDocSnapshot.data().StockComplet);
      setStockIncompletAvant(referenceDocSnapshot.data().StockIncomplet);
      setIncomplet(referenceDocSnapshot.data().Description);
      setStockCompletAvant(referenceDocSnapshot.data().StockComplet);
      setRéservéavant(referenceDocSnapshot.data().Réservé);
      setShowModal(true);
    } else {
      // Handle the case where the document doesn't exist or is not fetched properly
      console.log("Reference document not found or not fetched properly.");
    }
  };

  const handleBarcodeRead = (result) => {
    if (result.data && isScanning) {
      setIsScanning(false);
      setQRData(result.data);
      setIsQRCodeValidated(true);
      updatestock(result)
    }
  };

  const resetScanner = () => {
    setIsScanning(true);
    setIsQRCodeValidated(false);
    setShowModal(false);
  };

  const numerique=(Boolean) =>{
    if (Boolean==true){
      console.log(Boolean," : 1");
      return 1;
    }
    console.log(Boolean," : 0");
    return 0;
  }

  const handleReservedChange = (value) => {
    setReserved(value);
    if (value) {
      setStockComplet(false);
      setStockIncomplet(false);
    }
  };

  const handleStockCompletChange = (value) => {
    setStockComplet(value);
    if (value) {
      setStockIncomplet(false);
    }
  };

  const handleStockIncompletChange = (value) => {
    setStockIncomplet(value);
    if (value) {
      setStockComplet(false);
    }
  };

  const handlePartiChange = (value) => {
    setParti(value);
    if (value) {
      setReserved(false);
      setStockComplet(false);
      setStockIncomplet(false);
    }
  };

  const handleSubmit = async () => {
    const referenceParts = qrData.split("_");
    // console.log("refernece part :",referenceParts[0]);
    const id = referenceParts[0].trim();
    const user = FIREBASE_AUTH.currentUser;
    const userId = user.uid;
    const userDocRef = doc(FIREBASE_DATABASE, 'Utilisateur', userId);
    const userDocSnapshot = await getDoc(userDocRef);
    const ville = userDocSnapshot.data().pays;
    const lieu = userDocSnapshot.data().entrepot;
    const referenceDocRef = doc(FIREBASE_DATABASE, 'Pays', ville, lieu+'Effectif', referenceParts[0], 'id', qrData);
    const referenceDocRef1 = doc(FIREBASE_DATABASE, 'Pays', ville, lieu+'Effectif', referenceParts[0]);
    const DocSnapshot = await getDoc(referenceDocRef1);

    await updateDoc(referenceDocRef, {
      Réservé: Reserved, 
      StockComplet: StockComplet,
      StockIncomplet: StockIncomplet,
      Description: incomplet,
    });
    if (Parti===true){
      setStockIncomplet(false);
      setReserved(false);
      setStockComplet(false);
      await updateDoc(referenceDocRef, {
        StockIncomplet: false,
        StockComplet: false,
        Réservé: false,
        id_sortie:userId,
        Date_sortie:firebase.firestore.Timestamp.now(),
      });
      await updateDoc(referenceDocRef1, {
        StockIncomplet: DocSnapshot.data().StockIncomplet - numerique(StockIncompletAvant),
        StockComplet: DocSnapshot.data().StockComplet - numerique(StockCompletAvant),
        Réservé: DocSnapshot.data().Réservé - numerique(Réservéavant),
      });
    } else {
      if (StockComplet!=StockCompletAvant && StockComplet==true) {
        await updateDoc(referenceDocRef, {
          id_entrée:userId,
          Date_entrée:firebase.firestore.Timestamp.now(),
        });
      }
      if (StockIncomplet!=StockIncompletAvant && StockIncomplet==true ){
        await updateDoc(referenceDocRef1, {
          StockIncomplet: DocSnapshot.data().StockIncomplet + 1,
        });
      } else if (StockIncomplet!=StockIncompletAvant && StockIncomplet==false ){
        await updateDoc(referenceDocRef1, {
          StockIncomplet: DocSnapshot.data().StockIncomplet - 1 ,
        });
      }
      if (StockComplet!=StockCompletAvant && StockComplet==true ){
        await updateDoc(referenceDocRef1, {
          StockComplet: DocSnapshot.data().StockComplet + 1 ,
        });
      } else if (StockComplet!=StockCompletAvant && StockComplet==false ){
          await updateDoc(referenceDocRef1, {
          StockComplet: DocSnapshot.data().StockComplet - 1 ,
        });
      }
      if (Reserved!=Réservéavant && Reserved==true ){
        await updateDoc(referenceDocRef1, {
          Réservé: DocSnapshot.data().Réservé + 1 ,
          StockComplet: DocSnapshot.data().StockComplet - 1 ,
        });
      } else if (Reserved!=Réservéavant && Reserved==false ){
        await updateDoc(referenceDocRef1, {
          Réservé: DocSnapshot.data().Réservé - 1 ,
          StockComplet: DocSnapshot.data().StockComplet + 1 ,
        });
      }
    }
    setStockIncompletAvant(StockIncomplet);
    setStockCompletAvant(StockComplet);
    setRéservéavant(Reserved);
    resetScanner();
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Nessun accesso alla fotocamera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        onBarCodeScanned={handleBarcodeRead}
      >
        <View style={styles.maskContainer}>
          {!isQRCodeValidated && (
            <View style={styles.maskOuter}>
              <View style={styles.maskInner} />
            </View>
          )}
          <Text style={styles.maskText}>Allinea il codice QR all'interno della cornice</Text>
          {isQRCodeValidated && (
            <Image
              source={require("../../assets/validate.png")}
              style={styles.validatedImage}
            />
          )}
        </View>
      </Camera>

      <Modal
        visible={showModal}
        onRequestClose={resetScanner}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Modifica campi</Text>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Riservato:       No</Text>
            <Switch
              value={Reserved}
              onValueChange={handleReservedChange}
              thumbColor={Reserved ? '#61c6dd' : 'white'}
            />
            <Text style={styles.switchLabel}>     SÌ</Text>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Stock complet:       No</Text>
            <Switch
              value={StockComplet}
              onValueChange={handleStockCompletChange}
              thumbColor={StockComplet ? '#61c6dd' : 'white'}
              disabled={Reserved}
            />
            <Text style={styles.switchLabel}>     SÌ</Text>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Stock incomplet:       No</Text>
            <Switch
              value={StockIncomplet}
              onValueChange={handleStockIncompletChange}
              thumbColor={StockIncomplet ? '#61c6dd' : 'white'}
              disabled={Reserved}
            />
            <Text style={styles.switchLabel}>     SÌ</Text>
          </View>
          {StockIncomplet === true && (
            <TextInput
              value={incomplet}
              onChangeText={text => setIncomplet(text)}
              placeholder="Enter the incomplete element"
              style={styles.input}
            />
          )}

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Parti:       No</Text>
            <Switch
              value={Parti}
              onValueChange={handlePartiChange}
              thumbColor={Parti ? '#61c6dd' : 'white'}
              disabled={StockComplet || StockIncomplet || Reserved}
            />
            <Text style={styles.switchLabel}>     SÌ</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Invia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={resetScanner}
            >
              <Text style={styles.buttonText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: width,
    height: height,
  },
  maskContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  maskOuter: {
    width: "80%",
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "transparent",
    
  },
  maskInner: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  maskText: {
    marginTop: 16,
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  validatedImage: {
    alignItems:'center',
    justifyContent:'center',
    width: "40%",
    height: "10%",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  switchLabel: {
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginRight: 10,
    borderRadius: 10,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    backgroundColor: "#61c6dd",
    borderRadius:15,
  },
  cancelButton: {
    backgroundColor: "red",
    borderRadius:15,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },  
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: "100%",
  },
});

export default QRCodeScannerSortie;