/* --- Sierra Patron API Use ---
  Step 1: Authentication.
          A valid access token is required for every API request, tokens expire every hour. API Token is returned from fetchSierraAuthToken which uses a UTF8-64 encoded Client Key & Secret provided by library administrator.
  
  Step 2: Fetch patron's ID from barcode.
          Barcode scanner component returns the barcode's string value which gets passed to fetchUserIdFromBarcode. Uses Sierra Patron API "query" route via /v4/patrons/query with appropriate headers.

  Step 3: Fetch patron's account Expiration Date.
          fetchUserExpDateById returns a patron's expiration date which we compare to the current date. If expiration date after the current date, switch the smart power outlet on, allowing the patron to feed their parking reciept into the parking validation printer.
*/

import axios from 'axios'

const tempToken = 'Bearer g4st4seQ8mWdWOoW_-M1jXPVVNcxiGYNA-agQYoBmuyBablev5nl2u9JdzdouJlnXQa-7UvevVq-9HleAcuPyKCK8X6uDp6eeSdy5QO5xV8Ml4eqSgbm42hnqZc4zkh86rVTWshoj7L9bcXoXQkK57Q3Vhasqj2NT3OIVf3Wikk'

const fetchSierraAuthToken = () =>
  axios({
    method: 'post',
    url: 'https://catalog.princetonlibrary.org/iii/sierra-api/v1/token',
    headers: {
      'Authorization': 'Basic Q1BiNVZhbTFpNXpwQzlPdVcvb2RNSmdPV3J4WTpwYXJraW5ndmFsaWRhdGlvbg==',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: {
      'grant_type': 'client_credentials'
    },
    responseType: 'json'
  })
    .then(res => res.data.access_token)
    .catch(console.error);
    

// The fetchUserIdFromBarcode makes a patron query request which returns a response containing an array of URL links for a specific user. This link URL contains the User's Patron ID which is necessary for requesting more details about a user's account. Note: entries[0] assumes user has only one ID which may not be guaranteed
const fetchUserIdFromBarcode = (barcode, token) =>
  axios({
    method: 'post',
    url: 'https://catalog.princetonlibrary.org/iii/sierra-api/v4/patrons/query',
    headers: {
      'Authorization': token
    },
    params: {
      offset: 0,
      limit: 10000
    },
    data: {
      "target": {
        "record": { "type": "patron" },
        "field": { "tag": "b" }
      },
      "expr": {
        "op": "equals",
        "operands": [ barcode ]
      }
    }
  })
    .then(res => res.data.entries[0].link)
    .then(patronURL => {
      const splitURL = patronURL.split('/')
        , patronID = +splitURL[splitURL.length - 1]

      if (typeof patronID === 'number') {
        return { 
          patronID, 
          token 
        }
      }
      else throw new Error('Error. Patron ID Not Found.')
    })
    .catch(console.error);



const fetchUserExpStatusById = ({ patronID, token }) =>
  axios({
      method: 'get',
      url: `https://catalog.princetonlibrary.org/iii/sierra-api/v4/patrons/${patronID}`,
      headers: {
        'Authorization': token
      },
      responseType: 'json'
    })
    .then(res => res.data.expirationDate)
    .then(expDateStr => {
      const now = new Date()
        , nowFloor = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ].join('-')
        , dateFloor = new Date(nowFloor)
        , expDate = new Date(expDateStr.split('-'))
        , patronInfo = {}

      if (expDate <= dateFloor) {
        patronInfo.status = 'Unable to Validate.'
      } else {
        patronInfo.status = 'Validation Successful.'
      }
      patronInfo.expiration = `Your card expires on ${expDate}`
      return patronInfo
    })
    .catch(console.error)


export const validateUserByBarcode = barcode =>
  fetchSierraAuthToken()
    .then(token => fetchUserIdFromBarcode(barcode, token))
    .then(patronIdAndToken => fetchUserExpStatusById(patronIdAndToken))
    .catch(console.error);