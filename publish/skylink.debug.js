/*! skylinkjs - v1.0.0 - Wed Oct 28 2015 18:16:20 GMT+0800 (SGT) */

var DataChannel = function(channel){
	'use strict';
	var self = this;
	var id = channel.label;
	var reliable = false;
	var readyState = 'connecting';
	var channelType = 'generic';
	var objectRef = channel;

	Event.mixin(this);

	objectRef.onopen = function(event){
		this._trigger('connected', event);
	};

	objectRef.onmessage = function(event){
		this._trigger('message', event);
	};

	objectRef.onclose = function(event){
		this._trigger('disconnected', event);
	};

	objectRef.onerror = function(event){
		this._trigger('error', event);
	};
};

DataChannel.prototype.disconnect = function(){
	var self = this;
	objectRef.close();
};
var SkylinkEvent = {

	on: function(event, callback){
		this.listeners.on[event] = this.listeners.on[event] || [];
    	this.listeners.on[event].push(callback);
		return this;
	},

	off: function(event, callback){

		//Remove all listeners if event is not provided
		if (typeof event === 'undefined'){
			this.listeners.on = {};
			this.listeners.once = {};
		}

		//Remove all callbacks of the specified events if callback is not provided
		if (typeof callback === 'undefined'){
			this.listeners.on[event]=[];
			this.listeners.once[event]=[];
		}

		else{

			//Remove single on callback
			if (this.listeners.on[event]){				
				this._removeListener(this.listeners.on[event], callback);
			}
		
			//Remove single once callback
			if (this.listeners.once[event]){
				this._removeListener(this.listeners.once[event], callback);
			}
		}
		return this;
	},

	once: function(event, callback){
		this.listeners.once[event] = this.listeners.once[event] || [];
    	this.listeners.once[event].push(callback);
		return this;
	},

	_trigger: function(event){
		var args = Array.prototype.slice.call(arguments,1);

		if (this.listeners.on[event]){
			for (var i=0; i<this.listeners.on[event].length; i++) {
		    	this.listeners.on[event][i].apply(this, args);
		    }
		}

		if (this.listeners.once[event]){
			for (var j=0; j<this.listeners.once[event].length; j++){
		    	this.listeners.once[event][j].apply(this, args);
		    	this.listeners.once[event].splice(j,1);
		    	j--;
		    }
		}

		return this;
	},

	_removeListener: function(listeners, listener){
		for (var i=0; i<listeners.length; i++){
			if (listeners[i]===listener){
				listeners.splice(i,1);
				return;
			}
		}
	},

	_mixin: function(object){
		var methods = ['on','off','once','_trigger','_removeListener'];
		for (var i=0; i<methods.length; i++){
			if (SkylinkEvent.hasOwnProperty(methods[i]) ){
				if (typeof object === 'function'){
					object.prototype[methods[i]]=SkylinkEvent[methods[i]];	
				}
				else{
					object[methods[i]]=SkylinkEvent[methods[i]];
				}
			}
		}

		object.listeners = {
			on: {},
			once: {}
		};

		return object;
	}
};
var Global = {

	_signalingChannelOpen: false,

	_signalingServer: null,

};
var log = {};

// Parse if debug is not defined
if (typeof window.console.debug !== 'function') {
  window.console.newDebug = window.console.log;

} else {
  window.console.newDebug = window.console.debug;
}

// Parse if trace is not defined
if (typeof window.console.trace !== 'function') {
  window.console.newTrace = window.console.log;

} else {
  window.console.newTrace = window.console.trace;
}

/**
 * The log key
 * @attribute LogKey
 * @type String
 * @readOnly
 * @for Debugger
 * @since 0.5.4
 */
var LogKey = 'Skylink - ';

var Debugger = {
  /**
   * The current log level of Skylink.
   * @property level
   * @type Integer
   * @for Debugger
   * @since 0.5.4
   */
  level: 2,

  trace: false,

  /**
   * The flag that indicates if Skylink should store the debug logs.
   * @property store
   * @type Boolean
   * @for Debugger
   * @since 0.5.4
   */
  store: false,

  logs: [],

  console: {
    log: window.console.log.bind(window.console, LogKey + '%s> %s'),

    error: window.console.error.bind(window.console, LogKey + '%s> %s'),

    info: window.console.info.bind(window.console,
      (window.webrtcDetectedBrowser === 'safari' ? 'INFO: ' : '') + LogKey + '%s> %s'),

    warn: window.console.warn.bind(window.console, LogKey + '%s> %s'),

    debug: window.console.newDebug.bind(window.console,
      (typeof window.console.debug !== 'function' ? 'DEBUG: ' : '') + LogKey + '%s> %s')
  },

  traceTemplate: {
    log: '==LOG== ' + LogKey + '%s',
    error: '==ERROR== ' + LogKey + '%s',
    info: '==INFO== ' + LogKey + '%s',
    warn: '==WARN== ' + LogKey + '%s',
    debug: '==DEBUG== ' + LogKey + '%s'
  },

  applyConsole: function (type) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    if (this.store) {
      logs.push(type, args, (new Date()));
    }

    if (this.trace) {
      return window.console.newTrace.bind(window.console, this.traceTemplate[type]);
    }
    return this.console[type];
  },

  setLevel: function (inputLevel) {
    // Debug level
    if (inputLevel > 3) {
      log.debug = this.applyConsole('debug');

    } else {
      log.debug = function () { };
    }

    // Log level
    if (inputLevel > 2) {
      log.log = this.applyConsole('log');

    } else {
      log.log = function () { };
    }

    // Info level
    if (inputLevel > 1) {
      log.info = this.applyConsole('info');

    } else {
      log.info = function () { };
    }

    // Warn level
    if (inputLevel > 0) {
      log.warn = this.applyConsole('warn');

    } else {
      log.warn = function () { };
    }

    // Error level
    if (inputLevel > -1) {
      log.error = this.applyConsole('error');

    } else {
      log.error = function () { };
    }

    this.level = inputLevel;
  },

  configure: function (options) {
    options = options || {};

    // Set if should store logs
    Debugger.store = !!options.store;

    // Set if should trace
    Debugger.trace = !!options.trace;

    // Set log level
    Debugger.setLevel( typeof options.level === 'number' ? options.level : 2 );
  }
};

Debugger.setLevel(4);
var Socket = function (options) {

  'use strict';

  var self = this;

  if (!options){
    options = {};
  }

  self._signalingServer = options.server || 'signaling.temasys.com.sg';

  self._socketPorts = {
    'http': options.httpPorts || [80, 3000],
    'https': options.httpsPorts || [443, 3443]
  };

  self._type = options.type || 'WebSocket'; // Default

  self._socketTimeout = options.socketTimeout || 20000;

  self._isSecure = options.secure || false;

  self._readyState = 'constructed';

  self._isXDR = false;

  self._signalingServerProtocol = window.location.protocol.substring(0,window.location.protocol.length-1);

  self._socketMessageTimeout = null;

  self._socketMessageQueue = [];

  self.SOCKET_ERROR = {
    CONNECTION_FAILED: 0,
    RECONNECTION_FAILED: -1,
    CONNECTION_ABORTED: -2,
    RECONNECTION_ABORTED: -3,
    RECONNECTION_ATTEMPT: -4
  };

  self.SOCKET_FALLBACK = {
    NON_FALLBACK: 'nonfallback',
    FALLBACK_PORT: 'fallbackPortNonSSL',
    FALLBACK_SSL_PORT: 'fallbackPortSSL',
    LONG_POLLING: 'fallbackLongPollingNonSSL',
    LONG_POLLING_SSL: 'fallbackLongPollingSSL'
  };

  self._currentSignalingServerPort = null;

  self._channelOpen = false;

  self._objectRef = null; // The native socket.io client object

  self._firstConnect = false;

  self._socketOptions = {
    reconnection: true,
    reconnectionAttempts: 2,
    forceNew: true
  };

  // Append events settings in here
  SkylinkEvent._mixin(self);
};

Socket.prototype._assignPort = function(){

  var self = this;

  var ports = self._socketPorts[self._signalingServerProtocol];

  var currentPortIndex = ports.indexOf(self._currentSignalingServerPort);

  // First time connecting. Trying first port
  if (currentPortIndex === -1){
    console.log('first try',currentPortIndex);
    self._currentSignalingServerPort = ports[0];
  }
  // Trying next port
  else if (currentPortIndex > -1 && currentPortIndex < ports.length-1){
    console.log('second try',currentPortIndex);
    self._currentSignalingServerPort = ports[currentPortIndex+1];
  }
  // Reached the last port. Try polling next time
  else{
    console.log('last try',currentPortIndex);
    // Fallback to long polling and restart port index
    if (self._type === 'WebSocket'){
      console.log('falling back',currentPortIndex);
      self._type = 'Polling';
      self._currentSignalingServerPort = ports[0];
    }
    // Long polling already. Keep retrying
    else if (self._type === 'Polling'){
      console.log('desperate',currentPortIndex);
      self._socketOptions.reconnectionAttempts = 4;
      self._socketOptions.reconectionDelayMax = 1000;
    }

  }

};

Socket.prototype.connect = function(){
  var self = this;

  self.disconnect();

  self._assignPort();

  var url = self._signalingServerProtocol + '://' + self._signalingServer + ':' + self._currentSignalingServerPort;

  if (self._type === 'WebSocket') {
    console.log('setting WebSocket');
    self._socketOptions.transports = ['websocket'];
  } else if (self._type === 'Polling') {
    console.log('setting Polling');
    self._socketOptions.transports = ['xhr-polling', 'jsonp-polling', 'polling'];
    // self._socketOptions.transports = ['polling'];
  }

  console.log(url,self._socketOptions);

  self._objectRef = io.connect(url, self._socketOptions);

  if (!self._firstConnect){
    self._bindHandlers();
  }

};

Socket.prototype.disconnect = function(){
  var self = this;

  if (!self._channelOpen){
    return;
  }

  if (self._objectRef){
    self._objectRef.removeAllListeners('connect');
    self._objectRef.removeAllListeners('disconnect');
    self._objectRef.removeAllListeners('reconnect');
    self._objectRef.removeAllListeners('reconnect_attempt');
    self._objectRef.removeAllListeners('reconnecting');
    self._objectRef.removeAllListeners('reconnect_error');
    self._objectRef.removeAllListeners('reconnect_failed');
    self._objectRef.removeAllListeners('connect_error');
    self._objectRef.removeAllListeners('connect_timeout');
    self._objectRef.removeAllListeners('message');
    self._channelOpen = false;
    self._objectRef.disconnect();
  }

  self._trigger('channelClose');

};

Socket.prototype._bindHandlers = function(){

  var self = this;

  self._firstConnect = false; // No need to bind handlers next time

  // Fired upon connecting
  self._objectRef.on('connect', function(){
    self._channelOpen = true;
    self._readyState = 'connected';
    self._trigger('connected');
  });

  // Fired upon a connection error
  self._objectRef.on('error', function(error){
    self._channelOpen = false;
    self._readyState = 'error';
    self._trigger('error',error);
  });

  // Fired upon a disconnection
  self._objectRef.on('disconnect', function(){
    self._channelOpen = false;
    self._readyState = 'disconnected';
    self._trigger('disconnected');
  });

  // Fired upon a successful reconnection
  self._objectRef.on('reconnect', function(attempt){
    self._channelOpen = true;
    self._readyState = 'reconnect';
    self._trigger('reconnect',attempt);
  });  

  // Fired upon an attempt to reconnect
  self._objectRef.on('reconnect_attempt', function(){
    self._channelOpen = false;
    self._readyState = 'reconnect_attempt';
    self._trigger('reconnect_attempt');
  });  

  // Fired upon an attempt to reconnect
  // attempt: reconnection attempt count
  self._objectRef.on('reconnecting', function(attempt){
    self._readyState = 'reconnecting';
    self._trigger('reconnecting', attempt);
  });

  // Fired upon a reconnection attempt error
  self._objectRef.on('reconnect_error', function(error){
    self._channelOpen = false;
    self._readyState = 'reconnect_error';
    self._trigger('reconnect_error', error);
  });  

  // Fired when couldn't reconnect within reconnectionAttempts
  self._objectRef.on('reconnect_failed', function(){
    self._channelOpen = false;
    self._readyState = 'reconnect_failed';
    self._trigger('reconnect_failed');
    self.connect();
  });

  // Fired upon a connection error
  self._objectRef.on('connect_error', function(error){
    self._channelOpen = false;
    self._readyState = 'connect_error';
    self._trigger('connect_error', error);
  });

  // Fired upon a connection timeout
  self._objectRef.on('connect_timeout', function(error){
    self._channelOpen = false;
    self._readyState = 'connect_timeout';
    self._trigger('connect_timeout', error);
  });

  self._objectRef.on('message', function(){

  });  

};

var Stream = function (stream) {

  'use strict';

  var self = this;

  log.debug('Passed object for constructing new Stream object', stream);

  if (typeof stream !== 'object' || stream === null) {
    throw new Error('Object passed in for constructing a new Stream object is invalid');
  }

  /**
   * The Stream class stream settings.
   * @attribute _streamSettings
   * @param {JSON} MediaStreamConstraints The MediaStreamConstraints to be passed into the
   *   <code>getUserMedia()</code> for a new MediaStream.
   * @param {JSON} [audio=false] The audio setting of the Stream class object passed into
   *   the constructor to get a new MediaStream object.
   * @param {JSON} [video=false] The video setting of the Stream class object passed into
   *   the constructor to get a new MediaStream object.
   * @type JSON
   * @private
   */
  self._streamSettings = {
    audio: false,
    video: false,
    MediaStreamConstraints: {}
  };

  //self.readyState = 'constructed';

  /**
   * The Stream MediaStream object reference.
   * @attribute _ref
   * @type MediaStream
   * @private
   */
  self._ref = null;

  /**
   * The list of audio StreamTrack objects in the Stream.
   * @attribute _audioTracks
   * @type JSON
   * @private
   */
  self._audioTracks = [];

  /**
   * The list of video StreamTrack objects in the Stream.
   * @attribute _videoTracks
   * @type JSON
   * @private
   */
  self._videoTracks = [];

  // Event hook to object for triggering
  Event.mixin(self);

  // Initialise the MediaStream object to handle events
  // Or get a new MediaStream object with getUserMedia
  if (typeof stream.getAudioTracks === 'function' && typeof stream.getVideoTracks === 'function') {
    self._construct(stream);
  } else {
    if (typeof stream.audio === 'object' || typeof stream.audio === 'boolean') {
      self._streamSettings.audio = stream.audio;
    }
    if (typeof stream.video === 'object' || typeof stream.video === 'boolean') {
      self._streamSettings.video = stream.video;
    }

    self._streamSettings.MediaStreamConstraints = self._parseConstraints(self._streamSettings);

    window.navigator.getUserMedia(self._streamSettings.MediaStreamConstraints, function (streamObj) {
      self._construct(streamObj);
    }, function (error) {
      throw error;
    });
  }
};

/**
 * Parses and inteprets the constraints to be passed into <code>getUserMedia()</code>
 * @method _parseConstraints
 * @param {JSON} constraints The constraints passed into the constructor to get a
 *   new MediaStream object.
 * @return {JSON} The output MediaStreamConstraints.
 */
Stream.prototype._parseConstraints = function (constaints) {
  var mediaStreamConstraints = {
    audio: false,
    video: false
  };

  if (constraints.audio) {
    if (typeof constraints.audio === 'object') {
      mediaStreamConstraints.audio = {};

      if (Array.isArray(constraints.audio.optional)) {
        mediaStreamConstraints.audio.optional = constraints.audio.optional;
      }
    } else {
      mediaStreamConstraints.audio = true;
    }
  }

  if (constraints.video) {
    if (typeof constraints.video === 'object') {
      mediaStreamConstraints.video = {};

      if (Array.isArray(constraints.video.optional)) {
        mediaStreamConstraints.video.optional = constraints.video.optional;
      }

      var useOlderSpecsWHA = true;

      // Chrome / Opera uses older specs still even though it's deprecated.
      // Safari still uses the older specs
      // Only Firefox 38+ uses the new one
      // Correct specs
      /*
        {
          height: { min: 123, max: 1234 },
          width: { min:23, max: 234 },
          aspectRatio: { min: '1:3', max: '3:4' }
        }
      */
      // NOTE: Could be updated
      if (window.webrtcDetectedBrowser === 'firefox' || window.webrtcDetectedVersion > 38) {
        useOlderSpecsWHA = false;
      }

      // Check the values passed into specs
      var checkSpecsWHAVal = function (key, type, value) {
        var error = null;
        var setVal = false;

        if (key === 'aspectRatio') {
          if (typeof value === 'string') {
            try {
              var ratio = value.split(':');
              var w = parseInt(ratio[0], 10);
              var h = parseInt(ratio[1], 10);

              if (typeof w === 'number' && w > 0 && typeof h === 'number' && h > 0) {
                setVal = true;
              }
            } catch (errorObj) {
              error = errorObj;
            }
          }
        } else if (typeof value === 'number' && value > -1) {
          setVal = true;
        }

        if (setVal) {
          if (!useOlderSpecsWHA) {
            mediaStreamConstraints.video[key][type] = value;
          } else {
            var newKey = key[0].toUpperCase() + key.substring(1, key.length);
            if (typeof mediaStreamConstraints.video.mandatory !== 'object') {
              mediaStreamConstraints.video.mandatory = {};
            }
            mediaStreamConstraints.video.mandatory[type + newKey] = value;
          }
        } else {
          log.debug('Not setting string for video.' + key + '.' + type + ' as invalid or not found', value, error);
        }
      };

      // Since we have not moved to the latest adapterjs in https://github.com/webrtc/adapter/blob/master/adapter.js
      // as of October 28 (latest checked)
      // Move to minHeight / minWidth manually
      var convertToOlderSpecsWHA = function (key, specs) {
        if (typeof specs === 'object') {
          checkSpecsWHAVal(key, 'min', key.min);
          checkSpecsWHAVal(key, 'max', key.max);
        }
      };

      convertToOlderSpecsWHA('height', constraints.video.height);
      convertToOlderSpecsWHA('width', constraints.video.width);
      convertToOlderSpecsWHA('aspectRatio', constraints.video.aspectRatio);
    }
  }

  return mediaStreamConstraints;
};

/**
 * Listens the MediaStream events after being constructed.
 * @method _construct
 * @param {JSON} constraints The constraints passed into the constructor to get a
 *   new MediaStream object.
 * @return {JSON} The output MediaStreamConstraints.
 */
Stream.prototype._construct = function (stream) {

};

/*
// getAudioTracks function. Returns AudioStreamTrack objects.
Stream.prototype.getAudioTracks = function () {
  var self = this;

  return self._audioTracks;
};

// getVideoTracks function. Returns VideoStreamTrack objects.
Stream.prototype.getVideoTracks = function () {
  var self = this;

  return self._videoTracks;
};

// stop the stream itself.
Stream.prototype.stop = function () {
  var self = this;

  try {
    self._objectRef.stop();

  } catch (error) {
    // MediaStream.stop is not implemented.
    // Stop all MediaStreamTracks

    var i, j;

    for (i = 0; i < self._audioTracks.length; i += 1) {
      self._audioTracks[i].stop();
    }

    for (j = 0; j < self._videoTracks.length; j += 1) {
      self._videoTracks[j].stop();
    }
  }

  self.readyState = 'stopped';
  self.trigger('stopped', {});
};

// attach the video element with the stream
Stream.prototype.attachStream = function (dom) {
  var self = this;

  // check if IE or Safari
  // muted / autoplay is not supported in the object element
  if (window.webrtcDetectedBrowser === 'safari' ||
    window.webrtcDetectedBrowser === 'IE') {

    // NOTE: hasAttribute is only supported from IE 8 onwards
    if (dom.hasAttribute('muted')) {
      dom.removeAttribute('muted');
    }

    if (dom.hasAttribute('autoplay')) {
      dom.removeAttribute('autoplay');
    }
  }

  window.attachMediaStream(dom, self._objectRef);
};

// append listeners
Stream.prototype._appendListeners = function (mstream) {
  var self = this;

  self._objectRef = mstream;

  var i, j;

  var audioTracks = mstream.getAudioTracks();
  var videoTracks = mstream.getVideoTracks();

  for (i = 0; i < audioTracks.length; i += 1) {
    self._audioTracks[i] = new StreamTrack(audioTracks[i]);
  }

  for (j = 0; j < videoTracks.length; j += 1) {
    self._videoTracks[j] = new StreamTrack(videoTracks[j]);
  }

  self.readyState = 'streaming';
  self.trigger('streaming', {});
};

// initialise the stream object and subscription of events
Stream.prototype.start = function (constraints, mstream) {
  var self = this;

  // we don't manage the parsing of the stream.
  // just your own rtc getUserMedia stuff here :)
  self._constraints = constraints;

  // reset to null if undefined to have a fixed null if empty
  if (typeof self._constraints === 'undefined') {
    self._constraints = null;
  }

  if (typeof mstream === 'object' && mstream !== null) {

    if (typeof mstream.getAudioTracks === 'function' &&
      typeof mstream.getVideoTracks === 'function') {
      self._appendListeners(mstream);
      return;

    } else {
      return Util.throw(new Error('Provided mstream object is not a MediaStream object'));
    }

  } else {

    window.navigator.getUserMedia(self._constraints, function (mstreamrecv) {
      self._appendListeners(mstreamrecv);
    }, function (error) {
      // NOTE: throw is not support for older IEs (ouch)
      return Util.throw(error);
    });
  }
};*/
var StreamTrack = function (mstrack) {

  'use strict';

  var self = this;

  // The type of track "audio" / "video"
  self.type = mstrack.kind;

  // This track readyState
  self.readyState = 'streaming';

  // This track muted state
  self.muted = !mstrack.enabled;

  // This track native MediaStreamTrack reference
  self._objectRef = null;

  // Append events settings in here
  Event.mixin(self);

  if (typeof mstrack === 'object' && mstrack !== null) {
    self._appendListeners(mstrack);

  } else {
    return Util.throw(new Error('Provided track object is not a MediaStreamTrack object'));
  }
};

// append listeners
StreamTrack.prototype._appendListeners = function (mstrack) {
  var self = this;

  self._objectRef = mstrack;

  setTimeout(function () {
    self.trigger('streaming', {});
  }, 1000);
};

// mute track (enabled)
StreamTrack.prototype.mute = function () {
  var self = this;

  self._objectRef.enabled = false;

  self.muted = true;

  self.trigger('mute', {});
};

// unmute track (enabled)
StreamTrack.prototype.unmute = function () {
  var self = this;

  self._objectRef.enabled = true;

  self.muted = false;

  self.trigger('unmute', {});
};

// stop track
StreamTrack.prototype.stop = function () {
  var self = this;

  try {
    self._objectRef.stop();

  } catch (error) {
    return Util.throw(new Error('The current browser implementation does not ' +
      'support MediaStreamTrack.stop()'));
  }

  self.readyState = 'stopped';
  self.trigger('stopped', {});
};
var Util = {};

// Generates unique ID
Util.generateUUID = function () {
  /* jshint ignore:start */
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0; d = Math.floor(d/16); return (c=='x' ? r : (r&0x7|0x8)).toString(16); }
  );
  return uuid;
  /* jshint ignore:end */
};

// Helps to polyfill IE's unsupported throw.
// If supported throw, if not console error
Util.throwError = function (error) {
  if (window.webrtcDetectedBrowser === 'IE') {
    console.error(error);
    return;
  }
  throw error;
};

