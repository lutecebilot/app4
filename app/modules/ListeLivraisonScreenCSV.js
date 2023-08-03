
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, PermissionsAndroid, Platform, Button, Dimensions } from 'react-native';
import firebase from 'firebase/compat';
import Modal from 'react-native-modal';
import { FIREBASE_APP,FIREBASE_STORAGE, FIREBASE_AUTH, FIREBASE_DATABASE } from '../../firebaseconfig';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import * as ExpoPrint from 'expo-print';
import * as ExpoShare from 'expo-sharing';
import * as Papa from 'papaparse';
import ajouterCollections from './AjouterCollection';

const ListeLivraisonsScreenCSV = () => {
    const [value, setValue] = useState("test");
    const temporaryViewRef = useRef<View>(null);
    const [bonsDeLivraison, setBonsDeLivraison] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    
    const processExcelFile = async (fileUri) => {
        console.log('processing file')
        const response = await fetch(fileUri);
        const fileContents = await response.text();
        const parsedData = Papa.parse(fileContents).data;
        const paysCollection = firebase.firestore().collection('Pays');
        const italieDocument = paysCollection.doc('Italie');
        const jetlogCollection = italieDocument.collection('JetLog');
        const jetlogeffectifCollection = italieDocument.collection('JetLogEffectif');

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
        for (let i = startIndex ; i < endIndex; i++) {
            const row = parsedData[i];
            const documentName = row[2];
            const incrementNumber = row[5];    
            const documentRefsStartingWithDocumentName = [];        
            const querySnapshot = await jetlogCollection.orderBy(firebase.firestore.FieldPath.documentId()).startAt(documentName.toString()).endAt(documentName.toString()+'\uf8ff').get();            
            querySnapshot.forEach((doc) => {
                const documentName = doc.id; // Get the document ID (name)
                documentRefsStartingWithDocumentName.push(documentName);
              });
            console.log('test',documentRefsStartingWithDocumentName)
            for (const element of documentRefsStartingWithDocumentName){
                const documentRef = jetlogeffectifCollection.doc(element);
                const documentSnapshot = await documentRef.get();
                if (!documentSnapshot.exists) {
                    ajouterCollections(element)
                }
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
                            await qrcollection.add({
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
            htmlContent += '<p style="margin-top: -4em;"></p>';
        }
      
          if (index % 2 === 0) {
            // Cas pair, l'élément est une URL d'image (QR code)
            htmlContent += `<div style="display: inline-block; text-align: center;">
              <img src="${urlOrText}" style="width: 360px; height: 120px;" />
              <br />
              <span style="font-size: 18px;">${qrCodeUrls[index+1].split("_")[0]}</span>
              <br />
              <br />
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
      
    const sortedBonsDeLivraison = bonsDeLivraison.sort((a, b) => {
        // Assuming date_ajout is stored as a valid Date object in bonsDeLivraison
        const dateA = new Date(a.date_ajout).getTime();
        const dateB = new Date(b.date_ajout).getTime();
        return dateA - dateB; // Ascending order
      });
    
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
                data={sortedBonsDeLivraison} // Use the sorted array here
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
                        style={styles.documentButton_4}
                        onPress={() => handleDocumentPress(selectedDocument)}
                    >
                        <Text style={styles.documentButtonText_2}>Enregistrer l'arrivage</Text>
                    </TouchableOpacity>
                    </>
                )}
                </View>
                <View ref={temporaryViewRef} style={styles.view}>
                    <QRCode value={value} size={100} color="black" backgroundColor="white" />
                </View>
                <TouchableOpacity
                        style={styles.documentButton_2}
                        onPress={() => generatePDFFromQRCodeUrls()}
                    >
                        <Text style={styles.documentButtonText_2}>Générer PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                        style={styles.documentButton_3}
                        onPress={() => handleDocumentPress_3()}
                    >
                        <Text style={styles.documentButtonText_2}>Fermer la fenêtre</Text>
                </TouchableOpacity>
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
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    documentButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        flex: 1, // Permet au bouton de s'étendre sur toute la largeur de l'écran
        alignItems: 'center',
        width: Dimensions.get('window').width - 40, // Assurez-vous que le bouton prend toute la largeur disponible
    },
    documentButton_2: {
          backgroundColor: '#f0f0f0',
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
          alignItems: 'center',
           // Assurez-vous que le bouton prend toute la largeur disponible
    },
    documentButton_4: {
          backgroundColor: 'green',
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
          alignItems: 'center',
           // Assurez-vous que le bouton prend toute la largeur disponible
    },
    documentButton_3: {
          backgroundColor: 'red',
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
          alignItems: 'center',
           // Assurez-vous que le bouton prend toute la largeur disponible
    },
    documentButtonGreen: {
        backgroundColor: 'green',
    },
    documentButtonRed: {
        backgroundColor: 'red',
    },
    documentButtonText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    documentButtonText_2: {
          fontSize: 18,
          color: 'black',
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