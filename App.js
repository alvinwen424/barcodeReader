// Exported from snack.expo.io
import Expo from 'expo'
import React, { Component } from 'react'
import { Text, View, StyleSheet, Alert } from 'react-native'
import { Constants, BarCodeScanner, Permissions } from 'expo'

import { validateUserByBarcode, getPatronStatusFromServer } from './sierraValidate'

export default class App extends Component {
  state = {
    hasCameraPermission: null
  }

  componentDidMount() {
    this._requestCameraPermission()
  }

  _requestCameraPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA)
    this.setState({
      hasCameraPermission: status === 'granted',
    })
  }

  _handleBarCodeRead = data => {
    const barcode = data.data
    // {
    //   status: 'Validation Successful!',
    //     message: `Your card expires on ${expDate}`
    // }
    console.log('\n\nBARCODE\n\n', barcode)
    getPatronStatusFromServer(barcode)
      .then(patronStatus => {
        Alert.alert(patronStatus.status)
        Alert.alert(patronStatus.message)
        console.log(patronStatus)
      })
      .catch(console.error)

    // validateUserByBarcode(barcode)
    //   .then(patronStatus => {
    //     Alert.alert('Success')
    //     console.log(patronStatus)
    //   })
    //   .catch(console.error)
  }

  render() {
    const { hasCameraPermission } = this.state
    return (
      <View style={styles.container}>
        {hasCameraPermission === null 
          ? <Text>Requesting for camera permission</Text> 
          : hasCameraPermission === false 
            ? <Text>Camera permission is not granted</Text> 
            : (
                <View>
                  <Text>Scan Your Library Card To Validate</Text>
                  <BarCodeScanner
                    torchMode="on"
                    onBarCodeRead={this._handleBarCodeRead}
                    style={{ height: 400, width: 400 }}
                  />
                </View>
              )
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
})
Expo.registerRootComponent(App)
