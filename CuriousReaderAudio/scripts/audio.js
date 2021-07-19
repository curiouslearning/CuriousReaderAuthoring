var H5P = H5P || {};

/**
 * H5P audio module
 *
 * @external {jQuery} $ H5P.jQuery
 */
H5P.CRAudio = (function ($) {

  /**
  * @param {Object} params Options for this library.
  * @param {Number} id Content identifier.
  * @param {Object} extras Extras.
  * @returns {undefined}
  */
  function C(params, id, extras) {
    H5P.EventDispatcher.call(this);
    this.contentId = id;
    this.params = params;
    this.extras = extras;
    this.splittedWord = params.timeStampForEachText;
    this.sentenceStyles = (params.Sentence != undefined) ? params.Sentence.params.text : '';
    this.toggleButtonEnabled = true;
    this.setAutoPlay=( this.params.cpAutoplay!=undefined)?this.params.cpAutoplay:false;
    // Retrieve previous state
    if (extras && extras.previousState !== undefined) {
      this.oldTime = extras.previousState.currentTime;
    }
    this.params = $.extend({}, {
      playerMode: 'minimalistic',
      fitToWrapper: false,
      controls: true,
      autoplay: false,
      audioNotSupported: "Your browser does not support this audio",
      playAudio: "Play audio",
      pauseAudio: "Pause audio"
    }, params);
    this.on('resize', this.resize, this);
  }

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Adds a minimalistic audio player with only "play" and "pause" functionality.
   *
   * @param {jQuery} $container Container for the player.
   * @param {boolean} transparentMode true: the player is only visible when hovering over it; false: player's UI always visible
   */

  C.prototype.addMinimalAudioPlayer = function ($container, transparentMode) {
    var INNER_CONTAINER = 'h5p-audio-inner';
    var AUDIO_BUTTON = 'h5p-audio-minimal-button';
    var PLAY_BUTTON = 'h5p-audio-minimal-play';
    var PLAY_BUTTON_PAUSED = 'h5p-audio-minimal-play-paused';
    var PAUSE_BUTTON = 'h5p-audio-minimal-pause';
    var originalFontSize;

    var self = this;
    this.$container = $container;

    self.$inner = $('<div/>', {
      'class': INNER_CONTAINER + (transparentMode ? ' h5p-audio-transparent' : '')
    }).appendTo($container);

    var slideTextElement = '';
    if (this.splittedWord != undefined) {
      for (let i = 0; i < this.splittedWord.length; i++) {
        slideTextElement = slideTextElement + "<span id=" + i + ">" + this.splittedWord[i].text.trim() + ' </span>'
      }
    }


    var audioButton = $(slideTextElement).appendTo(self.$inner)
      .click(function () {
        if (!self.isEnabledToggleButton()) {
          return;
        }

        // Prevent ARIA from playing over audio on click
        //this.setAttribute('aria-hidden', 'true');

        // if (self.audio.paused) {
        //   self.play();
        // }
        // else {
        //   self.pause();
        // }
      })



    if (this.params.fitToWrapper) {
      audioButton.css({
        //   'width': '100%',
        //   'height': '100%'
      });

    }

    // cpAutoplay is passed from coursepresentation
    $(document).ready(function () {
      if (self.setAutoPlay) {
        if (self.audio.paused) {
          self.play();
        }
      }
    })


    //Event listeners that change the look of the player depending on events.
    self.audio.addEventListener('ended', function () {
      // $('.h5p-element-inner').css({
      //   'color':'black'
      // })
    });

    self.audio.addEventListener('play', function () {
      // audioButton
      //   .attr('aria-label', self.params.pauseAudio)
      //   .removeClass(PLAY_BUTTON)
      //   .removeClass(PLAY_BUTTON_PAUSED)
      //   .addClass(PAUSE_BUTTON);
    });

    self.audio.addEventListener('pause', function () {
      $('.h5p-element-inner').css({
        'color': 'black'
      })
      // audioButton
      //   .attr('aria-hidden', false)
      //   .attr('aria-label', self.params.playAudio)
      //   .removeClass(PAUSE_BUTTON)
      //   .addClass(PLAY_BUTTON_PAUSED);
    });
    self.audio.addEventListener('timeupdate', function () {

      var time = self.audio.currentTime, j = 0, word;
      var originalFont;
      originalFont = $('#' + 0).css('font-size')
      for (j = 0; j < self.splittedWord.length; j++) {

        word = self.splittedWord[j]

        if (word.highlighted == undefined)
          word.highlighted = false
        if (time > word['startDuration'] && time < word['endDuration']) {
          if (!word.highlighted) {
            word.highlighted = true;
            $('.h5p-current').each(function () {
              $(this).find('#' + j).css({
                "color": "yellow",
                // 'font-size':'6px',
                // "font-size": ((Number(originalFont.slice(0, originalFont.length - 2)) +3).toString() + 'px'),
              })

            });
          }
        }
        else if (word.highlighted) {
          $('.h5p-current').each(function () {
            $(this).find('#' + j).css({
              "color": "black",
              // "font-size": originalFont,
            })
          });
          word.highlighted = false;
        }
      }
    })

    this.$audioButton = audioButton;
    //Scale icon to container
    self.resize();
  };



  /**
   * Resizes the audio player icon when the wrapper is resized.
   */
  C.prototype.resize = function () {
    // Find the smallest value of height and width, and use it to choose the font size.
    if (this.params.fitToWrapper && this.$container && this.$container.width()) {
      var w = this.$container.width();
      var h = this.$container.height();
      if (w < h) {
        this.$audioButton.css({ 'font-size': w / 2 + 'px' });
      }
      else {
        this.$audioButton.css({ 'font-size': h / 2 + 'px' });
      }
    }
  };


  return C;
})(H5P.jQuery);

/**
 * Wipe out the content of the wrapper and put our HTML in it.
 *
 * @param {jQuery} $wrapper Our poor container.
 */
H5P.CRAudio.prototype.attach = function ($wrapper) {
  $wrapper.addClass('h5p-audio-wrapper');

  // Check if browser supports audio.
  var audio = document.createElement('audio');
  if (audio.canPlayType === undefined) {
    // Try flash
    this.attachFlash($wrapper);
    return;
  }

  // Add supported source files.
  if (this.params.files !== undefined && this.params.files instanceof Object) {
    for (var i = 0; i < this.params.files.length; i++) {
      var file = this.params.files[i];

      if (audio.canPlayType(file.mime)) {
        var source = document.createElement('source');
        source.src = H5P.getPath(file.path, this.contentId);
        source.type = file.mime;
        audio.appendChild(source);
      }
    }
  }

  if (!audio.children.length) {
    // Try flash
    this.attachFlash($wrapper);
    return;
  }

  if (this.endedCallback !== undefined) {
    audio.addEventListener('ended', this.endedCallback, false);
  }

  audio.className = 'h5p-audio';
  audio.controls = this.params.controls === undefined ? true : this.params.controls;
  audio.preload = 'auto';
  audio.style.display = 'block';

  if (this.params.fitToWrapper === undefined || this.params.fitToWrapper) {
    audio.style.width = '100%';
    if (!this.isRoot()) {
      // Only set height if this isn't a root
      audio.style.height = '100%';
    }
  }

  this.audio = audio;

  if (this.params.playerMode === 'minimalistic') {
    audio.controls = false;
    this.addMinimalAudioPlayer($wrapper, false);
  }
  else if (this.params.playerMode === 'transparent') {
    audio.controls = false;
    this.addMinimalAudioPlayer($wrapper, true);
  }
  else {
    audio.autoplay = this.params.autoplay === undefined ? false : this.params.autoplay;
    $wrapper.html(audio);
  }

  // Set time to saved time from previous run
  if (this.oldTime) {
    this.seekTo(this.oldTime);
  }
};

/**
 * Attaches a flash audio player to the wrapper.
 *
 * @param {jQuery} $wrapper Our dear container.
 */
H5P.CRAudio.prototype.attachFlash = function ($wrapper) {
  if (this.params.files !== undefined && this.params.files instanceof Object) {
    for (var i = 0; i < this.params.files.length; i++) {
      var file = this.params.files[i];
      if (file.mime === 'audio/mpeg' || file.mime === 'audio/mp3') {
        var audioSource = H5P.getPath(file.path, this.contentId);
        break;
      }
    }
  }

  if (audioSource === undefined) {
    $wrapper.addClass('h5p-audio-not-supported');
    $wrapper.html(
      '<div class="h5p-audio-inner">' +
      '<div class="h5p-audio-not-supported-icon"><span/></div>' +
      '<span>' + this.params.audioNotSupported + '</span>' +
      '</div>'
    );

    if (this.endedCallback !== undefined) {
      this.endedCallback();
    }
    return;
  }

  var options = {
    buffering: true,
    clip: {
      url: window.location.protocol + '//' + window.location.host + audioSource,
      autoPlay: this.params.autoplay === undefined ? false : this.params.autoplay,
      scaling: 'fit'
    },
    plugins: {
      controls: null
    }
  };

  if (this.params.controls === undefined || this.params.controls) {
    options.plugins.controls = {
      fullscreen: false,
      autoHide: false
    };
  }

  if (this.endedCallback !== undefined) {
    options.clip.onFinish = this.endedCallback;
    options.clip.onError = this.endedCallback;
  }

  this.flowplayer = flowplayer($wrapper[0], {
    src: "http://releases.flowplayer.org/swf/flowplayer-3.2.16.swf",
    wmode: "opaque"
  }, options);
};

/**
 * Stop the audio. TODO: Rename to pause?
 *
 * @returns {undefined}
 */
H5P.CRAudio.prototype.stop = function () {
  if (this.flowplayer !== undefined) {
    this.flowplayer.stop().close().unload();
  }
  if (this.audio !== undefined) {
    this.audio.pause();
  }
};

/**
 * Play
 */
H5P.CRAudio.prototype.play = function () {
  if (this.flowplayer !== undefined) {
    this.flowplayer.play();
  }
  if (this.audio !== undefined) {
    if(this.setAutoPlay)
    this.audio.play();
  }
};

/**
 * @public
 * Pauses the audio.
 */
H5P.CRAudio.prototype.pause = function () {

  if (this.audio !== undefined) {

    this.audio.pause();
    // $('.h5p-element-inner').css({
    //   'color':'black'
    // })
    this.audio.currentTime = 0
  }
};

/**
 * @public
 * Seek to audio position.
 *
 * @param {number} seekTo Time to seek to in seconds.
 */
H5P.CRAudio.prototype.seekTo = function (seekTo) {
  if (this.audio !== undefined) {
    this.audio.currentTime = seekTo;
  }
};

/**
 * @public
 * Get current state for resetting it later.
 *
 * @returns {object} Current state.
 */
H5P.CRAudio.prototype.getCurrentState = function () {
  if (this.audio !== undefined) {
    const currentTime = this.audio.ended ? 0 : this.audio.currentTime;
    return {
      currentTime: currentTime
    };
  }
};

/**
 * @public
 * Disable button.
 * Not using disabled attribute to block button activation, because it will
 * implicitly set tabindex = -1 and confuse ChromeVox navigation. Clicks handled
 * using "pointer-events: none" in CSS.
 */
H5P.CRAudio.prototype.disableToggleButton = function () {
  this.toggleButtonEnabled = false;
  if (this.$audioButton) {
    this.$audioButton.addClass(Audio.BUTTON_DISABLED);
  }
};

/**
 * @public
 * Enable button.
 */
H5P.CRAudio.prototype.enableToggleButton = function () {
  this.toggleButtonEnabled = true;
  if (this.$audioButton) {
    this.$audioButton.removeClass(Audio.BUTTON_DISABLED);
  }
};

/**
 * @public
 * Check if button is enabled.
 * @return {boolean} True, if button is enabled. Else false.
 */
H5P.CRAudio.prototype.isEnabledToggleButton = function () {
  return this.toggleButtonEnabled;
};

/** @constant {string} */
H5P.CRAudio.BUTTON_DISABLED = 'h5p-audio-disabled';