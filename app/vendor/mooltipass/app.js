/* Contains all methods which are accessed by the html app interface */
var mooltipass = mooltipass || {};
mooltipass.app = mooltipass.app || {};

// Is app already initialized
mooltipass.app._isInitializedLock = false;


chrome.runtime.onMessage.addListener(
    function(data, sender, callbackFunction) {
        //console.warn('chrome.runtime.onMessage(', data.id, ')');
        mooltipass.app.onMessage(data.id, data.message, callbackFunction);
    });


/**
 * Initialize all app related functions on startup
 */
mooltipass.app.init = function() {
    if(mooltipass.app._isInitializedLock) {
        return false;
    }

    mooltipass.app._isInitializedLock = true;

    mooltipass.device.init();
    mooltipass.ui._.init();
    mooltipass.ui.settings.init();
    mooltipass.ui.credentials.init();
    mooltipass.ui.sync.init();
    mooltipass.ui.developers.init();
    mooltipass.ui.experts.init();
    mooltipass.ui.contributors.init();

    mooltipass.prefstorage.getStoredPreferences(mooltipass.memmgmt.preferencesCallback);
    mooltipass.prefstorage.getStoredPreferences(mooltipass.datamemmgmt.preferencesCallback);
    mooltipass.filehandler.getSyncableFileSystemStatus(mooltipass.memmgmt.syncableFSStateCallback);
    mooltipass.filehandler.setSyncFSStateChangeCallback(mooltipass.memmgmt.syncableFSStateChangeCallback);

    return true;
};

mooltipass.app.onMessage = function(senderId, data, callbackFunction) {
    var inputObject = data;

    // Backwards compatibility:
    // No attribute command was given
    if(!data.command) {
        inputObject = mooltipass.app.translateRequestForBackwardsCompatibility(data);
    }

    if(inputObject.command == 'getMooltipassStatus') {
        var responseObject = {
            'command': inputObject.command,
            'success': true,
            'value': status,
            'connected': mooltipass.device.isConnected,
            'unlocked': mooltipass.device.isUnlocked,
            'locked': !mooltipass.device.isUnlocked,
            'noCard': mooltipass.device.hasNoCard,
            'version': mooltipass.device.version,
        };

        // Add backwards-compatible data information
        var backwards = mooltipass.app.translateResponseForBackwardsCompatibility(responseObject);
        // Merge backwards-compatible information into data object
        mergeObjects(backwards, responseObject);

        //console.log('Response Status:', responseObject);

        chrome.runtime.sendMessage(senderId, responseObject, function() {
            if(chrome.runtime.lastError) {
                // TODO: Chrome 49 returns this error which does not affect the functionality. No real solution found yet (2016-03-18)
                // TODO: Also contains a typo "reponse" instead of "response"
                if(chrome.runtime.lastError.message != "The message port closed before a reponse was received.") {
                    console.warn('Could not send response to client <', senderId, '>');
                    console.warn('Error:', chrome.runtime.lastError.message);
                }
            }
        });
        return;
    }


    inputObject.callbackFunction = function(_responseObject) {
        _responseObject.command = inputObject.command;
        // Add backwards-compatible data information
        var backwards = mooltipass.app.translateResponseForBackwardsCompatibility(_responseObject);
        // Merge backwards-compatible information into data object
        mergeObjects(backwards, _responseObject);
        //console.log('Response Status:', _responseObject);
        chrome.runtime.sendMessage(senderId, _responseObject, function() {
            if(chrome.runtime.lastError) {
                console.warn('Could not send response to client <', senderId, '>');
                console.warn('Error:', chrome.runtime.lastError.message);
            }
        });
    };

    //console.warn('mooltipass.app.onMessage()', 'inputObject:', inputObject);
    if(!inputObject.responseParameters) {
        inputObject.responseParameters = {};
    }
    inputObject.responseParameters.senderId = senderId;

    mooltipass.device.clients.add(senderId);
    mooltipass.device.interface.send(inputObject);
};

mooltipass.app.updateOnUnlock = function() {

};

mooltipass.app.updateOnConnect = function() {
    mooltipass.ui._.reset();
    mooltipass.ui.settings.getSettings();
};

mooltipass.app.updateOnLock = function() {
    mooltipass.device.endSingleCommunicationMode();
};

mooltipass.app.getPassword = function(_context, _username, _callback) {
    mooltipass.memmgmt.getPasswordForCredential(_context, _username, function(_status, _password) {
        _callback(_context, _username, _status, _password);
    });
};

mooltipass.app.translateRequestForBackwardsCompatibility = function(_request) {
    //console.log('mooltipass.app.translateRequestForBackwardsCompatibility()', _request);
    var output = {};

    // Get random number
    if('getRandom' in _request) {
        // { getRandom : [] }
        output.command = 'getRandomNumber';
    }
    else if('ping' in _request) {
        // { ping: [] }
        output.command = 'getMooltipassStatus';
    }
    else if('update' in _request) {
        // {update: {context: url, login: username, password: password}}
        output.command = 'updateCredentials';
        output.context = _request.update.context;
        output.username = _request.update.login;
        output.password = _request.update.password;
    }
    else if('getInputs' in _request) {
        // { getInputs : {context: parsed_url.domain, domain: parsed_url.domain, subdomain: parsed_url.subdomain} }
        output.command = 'getCredentials';
        output.contexts = [];
        if(_request.getInputs.subdomain && _request.getInputs.domain) {
            output.contexts.push(_request.getInputs.subdomain + '.' + _request.getInputs.domain);
        }
        if(_request.getInputs.domain) {
            output.contexts.push(_request.getInputs.domain);
        }
    }

    return output;
};

mooltipass.app.translateResponseForBackwardsCompatibility = function(_response) {
    var output = {};

    var command = _response.command;

    output.random = null;
    output.deviceStatus = null;
    output.credentials = null;
    output.noCredentials = null;
    output.updateComplete = null;

    if(_response.success && command == 'getRandomNumber') {
        output.random = _response.value;
    }
    else if(command == 'getMooltipassStatus') {
        output.deviceStatus = {};
        output.deviceStatus.version = mooltipass.device.version;
        output.deviceStatus.connected = mooltipass.device.isUnlocked;
        if(mooltipass.device.status == 'no-card') {
            output.deviceStatus.state = 'NoCard';
        }
        else if(mooltipass.device.status == 'locked') {
            output.deviceStatus.state = 'Locked';
        }
        else if(mooltipass.device.status == 'unlocked') {
            output.deviceStatus.state = 'Unlocked';
        }
        else if(mooltipass.device.singleCommunicationMode) {
            output.deviceStatus.state = 'ManageMode';
        }
        else if(!mooltipass.device.isConnected) {
            output.deviceStatus.state = 'NotConnected';
        }
        else {
            output.deviceStatus.state = 'Error';
        }
    }
    else if(command == 'getCredentials') {
        if(_response.success) {
            output.credentials = {
                'login': _response.username || "",
                'password': _response.password || ""
            }
        }
        else {
            output.noCredentials = true;
        }
    }
    else if(_response.success && (command == 'addCredentials' || command == 'updateCredentials')) {
        output.updateComplete = true;
    }

    return output;
};

$(function() {
    mooltipass.app.init();
});