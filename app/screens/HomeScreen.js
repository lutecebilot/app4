import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Button } from 'react-native';
/*import { useNavigation } from '@react-navigation/native';*/
import ReferenceList from '../modules/ReferenceList'; // Import du composant ReferenceList
import QRCodeScannerSortie from '../modules/QRCodeScannerSortie';
import PageLogout from '../modules/PageLogout';
import ExcelFilesButton from '../modules/ExcelFilesButton';
import ListeLivraisonScreenCSV from '../modules/ListeLivraisonScreenCSV';


const pageOptions = ['A', 'B', 'H', 'F', 'G', 'D'];

const HomeScreen = () => {
  const [currentPage, setCurrentPage] = useState('A'); 
  /*const navigation = useNavigation();*/

  const changePage = (page) => { 
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'A':
        return (
          <View style={styles.pageContainer}>
            <View style={styles.pageContainer}>
              <ReferenceList />
            </View>
          </View>
        );
      case 'B':
        return (
          <View style={styles.pageContainer}>
            <Text style={styles.title}>Page B</Text>
            <Text>Contenu de la page B</Text>
          </View>
        );
      case 'H':
        return (
           <View style={styles.pageContainer}>
            <Text style={styles.title}>Arrivi</Text>
            <ListeLivraisonScreenCSV/>
            <ExcelFilesButton/>
          </View>
        );
      case 'G':
        return (
          <View style={styles.pageContainer}>
            <QRCodeScannerSortie />
          </View>
        );
      case 'D':
        return (
          <View style={styles.pageContainer}>
            <Text style={styles.title}></Text>
            <PageLogout/>
            {/* <Button title="essai" onPress={Ajout} /> */}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderPage()}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => changePage('A')} style={styles.button}>
          <Image source={require('../../assets/warehouse.png')} style={styles.buttonImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changePage('H') }  style={styles.button}>
          <Image source={require('../../assets/camionentrant.png')} style={styles.buttonImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changePage('G')} style={styles.button}>
          <Image source={require('../../assets/qrcode.png')} style={styles.buttonImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changePage('D') }  style={styles.button}>
          <Image source={require('../../assets/logout.png')} style={styles.buttonImage} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40, // Add margin to move the title down
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'lightgray',
    padding: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlignVertical: 'center',
    alignItems: 'center',
  },
  buttonImage: {
    width: 50,
    height: 50,
  },
});

export default HomeScreen;