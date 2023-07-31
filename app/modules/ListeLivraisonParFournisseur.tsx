
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, PermissionsAndroid, Platform, Button } from 'react-native';
import firebase from 'firebase/compat';
import Modal from 'react-native-modal';
import { FIREBASE_APP,FIREBASE_STORAGE, FIREBASE_AUTH } from '../../firebaseconfig';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import * as ExpoPrint from 'expo-print';
import * as ExpoShare from 'expo-sharing';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import * as Papa from 'papaparse';

const   ListeLivraisonsScreenCSV = () => {
    const [value, setValue] = useState("test");
    const temporaryViewRef = useRef<View>(null);
    const [bonsDeLivraison, setBonsDeLivraison] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    
    const processExcelFile = async (fileUri) => {
        const response = await fetch(fileUri);
        const fileContents = await response.text();
        const parsedData = Papa.parse(fileContents).data;
        const paysCollection = firebase.firestore().collection('Pays');
        const italieDocument = paysCollection.doc('Italie');
        const jetlogCollection = italieDocument.collection('JetLog');
        const db = getFirestore(FIREBASE_APP);
        const user = FIREBASE_AUTH.currentUser;
        const userId = user.uid;
        const userDocRef = doc(db, 'Utilisateur', userId);
        const userDocSnapshot = await getDoc(userDocRef);
        const ville = userDocSnapshot.data().pays;
        const lieu = userDocSnapshot.data().entrepot;
        const generateUniqueId = () => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const idLength = 8;
            let uniqueId = '';
            for (let i = 0; i < idLength; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                uniqueId += characters.charAt(randomIndex);
            }
            return uniqueId;
        };
        let issuer = 'unknown'
        if (parsedData[0][0] === 'ISSUER:') {
            issuer = 'ZDIT';
        }
        if (parsedData[1][0] === 'COMMERCIAL INVOICE') {
            issuer= 'ZLYIT';
        }
        else {
            console.log('unrecognised issuer')
        }
        console.log(`Issuer: ${issuer}`)

        const processing_ZDIT = async () => {
            let startIndex = -1;
        let endIndex = -1;
        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];
            if (row[2] === 'Description of goods  ') {
                startIndex = i + 2;
            }
            if (row[3] === 'TOTAL:') {
                endIndex = i;
                break;
            }
        }

        const dbRef = firebase.database().ref('Pays/'+ville+'/'+lieu);
        const snapshot = await dbRef.once('value');

        for (let i = startIndex ; i < endIndex; i++) {
            const row = parsedData[i];
            const documentName = row[2];
            const incrementNumber = row[5];
            const macollection=[];
            try {
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const document = childSnapshot.val();
                        if (document.documentName.startsWith(documentName)) {
                            macollection.push(document.documentName);
                        }
                    });
                    console.log(macollection);
                } else {
                console.log("Aucun document trouvé dans la base de données.");
                }
            } catch (error) {
                console.error("Une erreur s'est produite :", error);
            }
            for (const element of macollection) {
                const documentRef = jetlogCollection.doc(element.toString());
                const documentSnapshot = await documentRef.get();
                if (documentSnapshot.exists) {
                    for (let j = 1; j <= incrementNumber; j++) {
                        const idCollectionRef = documentRef.collection('id');
                        const uniqueId = generateUniqueId();
                        const newItemRef = idCollectionRef.doc(`${element}_${uniqueId}`);
                        const currentDateTime = new Date();
                        const formattedDate = currentDateTime.toLocaleString();
                        setValue(`${element}_${uniqueId}`);
                        try {
                            if (!value) {
                                return;
                            }
                            const uri = await captureRef(temporaryViewRef, {
                                format: "png",
                                quality: 1,
                            });
                            const filePath = "qrcodes/" + `${element}_${uniqueId}` + ".png";
                            const response = await fetch(uri);
                            const blob = await response.blob();
                            await FIREBASE_STORAGE.ref(filePath).put(blob);
                            const adress = await FIREBASE_STORAGE.ref(filePath).getDownloadURL();
                            const qrcollection = firebase.firestore().collection('QRCode');
                            const newDocumentRef = await qrcollection.add({
                                qrCodeUrl: adress,
                                ref: `${element}_${uniqueId}`,
                                BonDeLivraison: selectedDocument,
                            });
                            console.log("QR code saved to Firestore successfully.");
                        } catch (error) {
                            console.error("Error while saving QR code to Firestore:", error);
                        }
                        newItemRef.set({
                            Stock: false,
                            Réservé: false,
                            Complet: false,
                            Date_entrée: formattedDate,
                            Date_sortie: 'Pas_encore',
                            ref: `${element}_${uniqueId}`,
                            id_entrée: 'Pas_encore',
                            id_sortie: 'Pas_encore',
                        });
                        console.log(`Élément ajouté dans la collection ${element}/id`);
                    }
                } else {
                    console.log(`Le document ${element} n'existe pas dans la collection JetLog`);
                }
            }
        }
        };
        
        const processing_ZLYIT = async () => {
            let startIndex = -1;
            let endIndex = -1;
        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];
            if (row[1] === 'Item No') {
                startIndex = i + 2;
            }
            if (row[0] === 'ToTal:') {
                endIndex = i;
                break;
            }
        }

        const dbRef = firebase.database().ref('Pays/'+ville+'/'+lieu);
        const snapshot = await dbRef.once('value');

        for (let i = startIndex ; i < endIndex; i++) {
            const row = parsedData[i];
            const documentName = row[2];
            const incrementNumber = row[5];
            const macollection=[];
            try {
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const document = childSnapshot.val();
                        if (document.documentName.startsWith(documentName)) {
                            macollection.push(document.documentName);
                        }
                    });
                    console.log(macollection);
                } else {
                console.log("Aucun document trouvé dans la base de données.");
                }
            } catch (error) {
                console.error("Une erreur s'est produite :", error);
            }
            for (const element of macollection) {
                const documentRef = jetlogCollection.doc(element.toString());
                const documentSnapshot = await documentRef.get();
                if (documentSnapshot.exists) {
                    for (let j = 1; j <= incrementNumber; j++) {
                        const idCollectionRef = documentRef.collection('id');
                        const uniqueId = generateUniqueId();
                        const newItemRef = idCollectionRef.doc(`${element}_${uniqueId}`);
                        const currentDateTime = new Date();
                        const formattedDate = currentDateTime.toLocaleString();
                        setValue(`${element}_${uniqueId}`);
                        try {
                            if (!value) {
                                return;
                            }
                            const uri = await captureRef(temporaryViewRef, {
                                format: "png",
                                quality: 1,
                            });
                            const filePath = "qrcodes/" + `${element}_${uniqueId}` + ".png";
                            const response = await fetch(uri);
                            const blob = await response.blob();
                            await FIREBASE_STORAGE.ref(filePath).put(blob);
                            const adress = await FIREBASE_STORAGE.ref(filePath).getDownloadURL();
                            const qrcollection = firebase.firestore().collection('QRCode');
                            const newDocumentRef = await qrcollection.add({
                                qrCodeUrl: adress,
                                ref: `${element}_${uniqueId}`,
                                BonDeLivraison: selectedDocument,
                            });
                            console.log("QR code saved to Firestore successfully.");
                        } catch (error) {
                            console.error("Error while saving QR code to Firestore:", error);
                        }
                        newItemRef.set({
                            Stock: false,
                            Réservé: false,
                            Complet: false,
                            Date_entrée: formattedDate,
                            Date_sortie: 'Pas_encore',
                            ref: `${element}_${uniqueId}`,
                            id_entrée: 'Pas_encore',
                            id_sortie: 'Pas_encore',
                        });
                        console.log(`Élément ajouté dans la collection ${element}/id`);
                    }
                } else {
                    console.log(`Le document ${element} n'existe pas dans la collection JetLog`);
                }
            }
        }
        };

    };
      
    const getQRCodeUrlsFromFirestore = async () => {
        try {
          const qrcollection = firebase.firestore().collection('QRCode');
          const querySnapshot = await qrcollection.get();
          const qrCodeUrls = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.qrCodeUrl && data.BonDeLivraison.id === selectedDocument.id) {
              qrCodeUrls.push({ qrCodeUrl: data.qrCodeUrl, reference: data.ref });
            }
          });
      
          // Trier les QR codes par référence (la partie avant le "_")
          qrCodeUrls.sort((a, b) => {
            const referenceA = a.reference.split('_')[0];
            const referenceB = b.reference.split('_')[0];
            return referenceA.localeCompare(referenceB);
          });
      
          // Transformer chaque objet en deux éléments distincts dans la liste
          const flattenedList = qrCodeUrls.flatMap(({ qrCodeUrl, reference }) => [qrCodeUrl, reference]);
      
          return flattenedList;
        } catch (error) {
          console.error('Erreur lors de la récupération des URLs de QRCode depuis Firestore:', error);
          return [];
        }
      };
      
      
    const generateHTMLContent = (qrCodeUrls) => {
        let htmlContent = '<html><body> <br /><br />';
        qrCodeUrls.forEach((urlOrText, index) => {
          if (index % 4 === 0 && index !== 0) {
            // Saut de ligne après chaque paire de QR codes (à chaque multiple de 4 sauf le début)
            htmlContent += '<br />'.repeat(6);
          }
          if (index % 16 === 0 && index !== 0) {
            // Saut de ligne après chaque paire de QR codes (à chaque multiple de 4 sauf le début)
            htmlContent += '<br />'.repeat(1);
          }
      
          if (index % 2 === 0) {
            // Cas pair, l'élément est une URL d'image (QR code)
            htmlContent += `<div style="display: inline-block; text-align: center;">
              <img src="${urlOrText}" style="width: 360px; height: 120px;" />
              <br />
              <span style="font-size: 18px;">${qrCodeUrls[index+1].split("_")[0]}</span>
            </div>`;
            // if (index % 4 === 0) {
            //     htmlContent += '<br />'.repeat(4);
            // }
          }
        });
        htmlContent += '</body></html>';
        return htmlContent;
      };   
      
    const generatePDFFromQRCodeUrls = async () => {
        const isPermitted = async () => {
            if (Platform.OS === 'android') {
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                } catch (err) {
                    console.error('Write permission err', err);
                    return false;
                }
            } else {
                return true;
            }
        };
        
        isPermitted();
        
        try {
            const qrCodeUrls = await getQRCodeUrlsFromFirestore();
            const htmlContent = generateHTMLContent(qrCodeUrls);
            
            try{
                const file = ExpoPrint.printToFileAsync({
                    html: htmlContent,
                    base64: false,
                    // width: 2480,
                    // height:3508,
                })
                await ExpoShare.shareAsync((await file).uri);
                console.log("PDF généré");
            }catch (error){
                console.log('Erreur lors de la génération du PDF :', error)
            }
        }catch (error) {
            console.error('Erreur lors de la génération du PDF à partir des URLs de QRCode:', error);
        }
    };

    const handleDocumentPress_2 = (document) => {
        setSelectedDocument(document);
    };

    const handleDocumentPress_3=()=>{
        setSelectedDocument(null);
    }
      
    useEffect(() => {
        // Fonction pour récupérer la liste des documents depuis Firebase
        const fetchBonsDeLivraison = async () => {
            const querySnapshot = await firebase.firestore().collection('Bons_de_livraison').get();
            const documents = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setBonsDeLivraison(documents);
        };
      
        fetchBonsDeLivraison();
    }, []);
      
    const handleDocumentPress = async (document) => {
        if (!document.enregistre) {
            try {
                // Exécuter la fonction processExcelFile avec la valeur de 'access'
                await processExcelFile(document.access);
                alert('Livraison enregistrée !')
                // Mettre à jour le champ 'enregistre' dans la collection Firebase
                await firebase.firestore().collection('Bons_de_livraison').doc(document.id).update({
                    enregistre: true,
                });
                setSelectedDocument(null); // Fermer la modal
                // Mettre à jour l'état local (bonsDeLivraison) pour refléter le changement
                setBonsDeLivraison((prevState) => {
                    return prevState.map((doc) =>
                        doc.id === document.id ? { ...doc, enregistre: true } : doc
                    );
                });
            } catch (error) {
                console.error('Erreur lors de l\'exécution de processExcelFile:', error);
                // Gérer l'erreur ici, par exemple en affichant une alerte
            }
        } else {
            // Livraison déjà enregistrée, afficher une alerte
            alert('Livraison déjà enregistrée');
        }
    };
      
    const renderItem = ({ item }) => {
        const buttonStyle = item.enregistre === true ? styles.documentButtonGreen : styles.documentButtonRed;
        return (
            <TouchableOpacity style={[styles.documentButton, buttonStyle]} onPress={() => handleDocumentPress_2(item)}>
                <Text style={styles.documentButtonText}>{item.ref_no}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Liste des documents :</Text>
            <FlatList
              data={bonsDeLivraison}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
            />
            <Modal isVisible={selectedDocument !== null} onBackdropPress={() => setSelectedDocument(null)}>
            <View style={styles.modalContent}>
                {selectedDocument && (
                    <>
                    {Object.entries(selectedDocument).map(([key, value]) => (
                        <Text key={key} style={styles.modalText}>{`${key}: ${value}`}</Text>
                    ))}
                    <TouchableOpacity
                        style={styles.documentButton}
                        onPress={() => handleDocumentPress(selectedDocument)}
                    >
                        <Text style={styles.documentButtonText}>Enregistrer l'arrivage</Text>
                    </TouchableOpacity>
                    </>
                )}
                </View>
                <View ref={temporaryViewRef} style={styles.view}>
                    <QRCode value={value} size={100} color="black" backgroundColor="white" />
                </View>
                <View style={styles.container}>
                    <Button title="Générer PDF" onPress={generatePDFFromQRCodeUrls} />
                </View>
                <View style={styles.container}>
                    <Button title="Fermer la fenêtre" onPress={handleDocumentPress_3} />
                </View>
            </Modal>
            </View>
        );
    };


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  documentButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  documentButtonGreen: {
    backgroundColor: 'green',
  },
  documentButtonRed: {
    backgroundColor: 'red',
  },
  documentButtonText: {
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  view: {
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
});

export default ListeLivraisonsScreenCSV;