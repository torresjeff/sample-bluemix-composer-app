/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const cfenv = require('cfenv');
const express = require('express');
const ObjectStorageWallet = require('./lib/objectstorewallet');
const os = require('os');

const app = express();

// Connect to the deployed business network.
const businessNetworkConnection = new BusinessNetworkConnection();
const connectionProfileName = process.env.COMPOSER_CONNECTION_PROFILE;
const businessNetworkIdentifier = process.env.COMPOSER_BUSINESS_NETWORK;
const userID = process.env.COMPOSER_USER_ID;
const userSecret = process.env.COMPOSER_USER_SECRET;
const container = process.env.OBJECT_STORAGE_CONTAINER;
const wallet = new ObjectStorageWallet(container);
return businessNetworkConnection.connect(connectionProfileName, businessNetworkIdentifier, userID, userSecret, { wallet: wallet })
    .then(() => {

        // Register a route for handling ping requests.
        const hostname = os.hostname();
        app.get('/', (req, res, next) => {
            businessNetworkConnection.ping()
                .then((result) => {
                    result = Object.assign(result, { hostname: hostname });
                    res.json(result);
                })
                .catch((error) => {
                    next(error);
                });
        });

        // Start listening for HTTP requests.
        const appEnv = cfenv.getAppEnv();
        return new Promise((resolve, reject) => {
            app.listen(appEnv.port, appEnv.bind, (error) => {
                if (error) {
                    return reject(error);
                }
                console.log('Application started on ' + appEnv.url);
                resolve();
            });
        });

    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });