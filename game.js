var MemoryGame = (function () {
	var body     = document.body
	,   create   = document.createElement.bind(document)
	,   sandboxF = create('iframe')
	,   sandbox  = body.appendChild(sandboxF).contentWindow
	,   Array    = sandbox.Array // sandbox Array
	,   hasTransition = (function () { return create('p').style.transition !== undefined; })()
	;

	sandboxF.style.display = 'none'; // hide sandbox frame

	// Utilities
	function times       (n,f) { var i=n;for(;i>0;i--){f();} }
	function uuid        ()    { return (Math.random()*1e6)|0; }
	function toggleClass (ele, name, on) {
		var reg    = new RegExp('\s*' + name + '\s*')
		,   force  = typeof on !== 'undefined'
		;

		if (reg.test(ele.className) && (!force || (force && !on))) {
			ele.className = ele.className.replace(reg, ' ');
		} else if (!force || (force && on)) {
			ele.className += ' ' + name; 
		}
	}

	Array.prototype.copy      = function () {return this.slice(0);};
	Array.prototype.randomize = function () {return this.sort(function(){return Math.random()>=0.5;})};
	Array.prototype.randCopy  = function () {return this.copy().sort(function(){return Math.random()>=0.5;})};

	// Game Objects
	// ------
	//  CARD
	// ------
	var Card = function (type) {
		this.type     = type;
		this.flipped  = false;
	};
	Card.prototype.flipClass = 'flipped';
	Card.prototype.tmpl = function () {
		return '<front>'+this.type+'</front><back>&nbsp;</back>';
	};
	Card.prototype.render = function (parentNode) {
		this.node = create('card');
		this.node.id = 'card-' + uuid();
		parentNode.appendChild(this.node);
		this.node.innerHTML = this.tmpl();
	};
	Card.prototype.flip = function () {
		this.flipped = !this.flipped;
		toggleClass(this.node, this.flipClass, this.flipped);
	};

	// ------
	//  GAME
	// ------
	var Game = function (size) {
		this.gamesize = size;
		this.resetBtn           = create('button'); 
		this.resetBtn.innerHTML = 'please sir, may I have another?';
		this.resetBtn.addEventListener('click', function () { this.reset(); }.bind(this), false);
	};
	Game.prototype.tries      = 3;
	Game.prototype.turnDelay  = 2000;
	Game.prototype.STATES     = { 
		play:      'pick a card, any card',
		turn:      'choose carefully', 
		fail:      'this is sad', 
		win:       'you win!', 
		badmatch:  'does not match',
		goodmatch: 'very nice :)'
	};
	// http://unicode.johnholtripley.co.uk/all
	Game.prototype.cardTypes = new Array('&#x2605', '&#x260E', '&#x266B', '&#x2665', '&#x2640', '&#x2642');

	Game.prototype.cardSelect = function (card) {
		if (
			!'state' in this                     || 
			this.state === this.STATES.fail      || 
			this.state === this.STATES.win       ||
			this.state === this.STATES.badmatch  ||
			this.state === this.STATES.goodmatch ||
			card.flipped
		) { return; }

		card.flip();
		switch (this.state) {
			case this.STATES.play:
				this.last = card;
				this.state = this.STATES.turn;
			break;
			case this.STATES.turn:
				if (card.type == this.last.type) {
					this.remaining -= 2;
					if (this.remaining === 0) {
						this.state = this.STATES.win
					} else {
						this.state = this.STATES.goodmatch;
						setTimeout(function () {
							this.state = this.STATES.play;
							this.showState();
						}.bind(this), this.turnDelay>>1); 
					}
				} else {
					if (this.triesLeft <= 1) {
						this.state = this.STATES.fail;
						this.triesLeft--;
					} else {
						this.state = this.STATES.badmatch;
						setTimeout(function () {
							card.flip();
							this.last.flip();
							this.state = this.STATES.play;
							this.triesLeft--;
							this.showState();
						}.bind(this), this.turnDelay);
					}
				}
			break;
		}
		this.showState();
	};
	Game.prototype.start = function () {
		var dis      = this;

		this.remaining = this.gamesize;
		this.triesLeft = this.tries;
		this.gameui    = body.appendChild(create('game'));
		this.stateui   = this.gameui.appendChild(create('status'));
		this.triesui   = this.gameui.appendChild(create('tries'));
		this.boardui   = this.gameui.appendChild(create('board'));

		this.deck = (function () {
			var ptr       = 0
			,   randTypes = dis.cardTypes.randCopy()
			,   deck      = new Array()
			;

			times(dis.gamesize, function () {
				times(2, function () {
					var card = new Card(randTypes[ptr]);
					deck.push(card);
				});
				ptr = ((ptr+1) % randTypes.length === 0) ? 0 : ptr + 1;
			});
			return deck;
		})().randomize();

		this.deck.forEach(function (v,i) {
			v.render(dis.boardui);
			v.node.addEventListener('click', function () { dis.cardSelect.bind(dis)(v) }, false);
		});

		this.state = this.STATES.play;
		this.showState();
	};
	Game.prototype.reset = function () {
		var items = 0
		,   reset = function () { 
				body.removeChild(this.gameui);
				this.start();
			}.bind(this);

		this.deck.forEach(function (v) {
			if (v.flipped) { 
				v.flip();
				hasTransition && v.node.addEventListener('transitionend', function () {
					items --;
					items === 0 && reset();
				});
				items++; 
			}
		});
		!hasTransition && setTimeout(reset, 400);
	};
	Game.prototype.showState = function () {
		function triesToHearts (tries) {
			var heartString = "";
			times(tries, function () {
				heartString += "&#x2665 ";
			});
			return heartString;
		}
		this.stateui.innerHTML = this.state;

		if (this.triesLeft > 0) {
			this.triesui.innerHTML = triesToHearts(this.triesLeft); 
		} else {
			this.triesui.innerHTML = '';
			this.triesui.appendChild(this.resetBtn);
		}
	};

	return Game;
})(); // <-- Doug hates this

