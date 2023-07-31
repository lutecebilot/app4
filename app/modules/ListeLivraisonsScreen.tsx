import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, PermissionsAndroid, Platform, Button } from 'react-native';
import firebase from 'firebase/compat';
import { useNavigation } from '@react-navigation/native';
import Modal from 'react-native-modal';
import * as XLSX from 'xlsx';
import { FIREBASE_APP,FIREBASE_STORAGE,FIREBASE_DATABASE } from '../../firebaseconfig';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import * as ExpoPrint from 'expo-print';
import * as ExpoShare from 'expo-sharing';


const   ListeLivraisonsScreen = () => {
    const uploadFile = async (fileUri, destinationPath) => {
        try {
            const response = await fetch(fileUri);
            const blob = await response.blob();
            const storageRef = FIREBASE_STORAGE.ref().child(destinationPath);
            await storageRef.put(blob, );
            console.log('File uploaded successfully!');
            } catch (error) {
            console.error('Error uploading file:', error);
        }
    };
    
    /*uploadFile('https://docs.google.com/spreadsheets/d/1-BBh7nMXD9_DIJZIgBkCAhexoxIk1KxB/edit?usp=drive_link&ouid=108490173627590330509&rtpof=true&sd=true','bons_de_livraison/23.07.23/bon_de_livraison_1.xlsx');
    uploadFile('https://docs.google.com/spreadsheets/d/1qfp0CQuylp8luzoC6YGxNatfq33_V8ro/edit?usp=drive_link&ouid=108490173627590330509&rtpof=true&sd=true','bons_de_livraison/23.07.23/bon_de_livraison_2.xlsx');
    uploadFile('https://docs.google.com/spreadsheets/d/1YDP-73fJ_gcSUPBwZdH2R_ieSWQoVBXd/edit?usp=drive_link&ouid=108490173627590330509&rtpof=true&sd=true','bons_de_livraison/23.07.23/bon_de_livraison_3.xlsx');
    */
   const [value, setValue] = useState("test");
    const temporaryViewRef = useRef<View>(null);
    const [bonsDeLivraison, setBonsDeLivraison] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const navigation = useNavigation();

    const processExcelFile = async (fileUri) => {
        const response = await fetch(fileUri);
        const fileContents = await response.text();
        const workbook = XLSX.read(fileContents, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const paysCollection = firebase.firestore().collection('Pays');
        const italieDocument = paysCollection.doc('Italie');
        const jetlogCollection = italieDocument.collection('JetLog');
      
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

        let startIndex = -1;
        let endIndex = -1;
        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            if (row[3] === 'Description of goods') {
                startIndex = i + 2;
            }
            if (row[4] === 'TOTAL:') {
                endIndex = i;
                break;
            }
        }
      
        for (let i = startIndex ; i < endIndex; i++) {
            const row = excelData[i];
            const documentName = row[3];
            const incrementNumber = row[6];
            const documentRef = jetlogCollection.doc(documentName.toString());
            const documentSnapshot = await documentRef.get();
            if (documentSnapshot.exists) {
                for (let j = 1; j <= incrementNumber; j++) {
                    const idCollectionRef = documentRef.collection('id');
                    const uniqueId = generateUniqueId();
                    const newItemRef = idCollectionRef.doc(`${documentName}-${uniqueId}`);
                    const currentDateTime = new Date();
                    const formattedDate = currentDateTime.toLocaleString();
                    setValue(`${documentName}-${uniqueId}`);
                    try {
                        if (!value) {
                            return;
                        }
                        const uri = await captureRef(temporaryViewRef, {
                            format: "png",
                            quality: 1,
                        });
                        const filePath = "qrcodes/" + `${documentName}-${uniqueId}` + ".png";
                        const response = await fetch(uri);
                        const blob = await response.blob();
                        await FIREBASE_STORAGE.ref(filePath).put(blob);
                        const adress = await FIREBASE_STORAGE.ref(filePath).getDownloadURL();
                        const qrcollection = firebase.firestore().collection('QRCode');
                        const newDocumentRef = await qrcollection.add({
                            qrCodeUrl: adress,
                            ref: `${documentName}-${uniqueId}`,
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
                        ref: `${documentName}-${uniqueId}`,
                        id_entrée: 'Pas_encore',
                        id_sortie: 'Pas_encore',
                    });
                    console.log(`Élément ajouté dans la collection ${documentName}/id`);
                }
            } else {
                console.log(`Le document ${documentName} n'existe pas dans la collection JetLog`);
            }
        }
    };
      
    const getQRCodeUrlsFromFirestore = async () => {
        try {
            const qrcollection = firebase.firestore().collection('QRCode');
            const querySnapshot = await qrcollection.get();
            const qrCodeUrls = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.qrCodeUrl && data.BonDeLivraison.id===selectedDocument.id) {
                    qrCodeUrls.push(data.qrCodeUrl);
                    qrCodeUrls.push(data.ref);
                }
            });
            return qrCodeUrls;
        } catch (error) {
            console.error('Erreur lors de la récupération des URLs de QRCode depuis Firestore:', error);
            return [];
        }
    };
      
    const generateHTMLContent = (qrCodeUrls) => {
        let htmlContent = '<html><body>';
        qrCodeUrls.forEach((urlOrText, index) => {
          if (index % 2 === 0) {
            // Cas pair, l'élément est une URL d'image
            htmlContent += `<div style="position: relative;">
            <img src="${urlOrText}" style="margin-right: 1000px;" />
            </div>`
        } else {
            // Cas impair, l'élément est un texte
            htmlContent += `<div style="position: relative; top: -200; right: -300; text-align: center;">
              <span style="font-size: 45px;">${urlOrText}</span>
            </div>`;
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
            console.log(htmlContent);
            try{
                const file = ExpoPrint.printToFileAsync({
                    html: htmlContent,
                    base64: false,
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

export default ListeLivraisonsScreen;