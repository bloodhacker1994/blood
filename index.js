
var express = require('express');
var _ = require("lodash");
var bcrypt = require('bcryptjs');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser');
const PokerEvaluator = require('poker-evaluator');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
var MongoClient = require('mongodb').MongoClient;
var uri = "";
let referralCodeGenerator = require('referral-code-generator')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.set('port', process.env.PORT || 3000);

app.get('/', function (req, res) {
	console.log(" Client connecting....");
	// res.send("Hello express");
});


var pokerClients = [];
var socketInfo = {};
var totalCards = ["Ac", "Kc", "Qc", "Jc", "Tc", "9c", "8c", "7c", "6c", "5c", "4c", "3c", "2c", "Ad", "Kd", "Qd", "Jd", "Td", "9d", "8d", "7d", "6d", "5d", "4d", "3d", "2d", "Ah", "Kh",
	"Qh", "Jh", "Th", "9h", "8h", "7h", "6h", "5h", "4h", "3h", "2h", "As", "Ks", "Qs", "Js", "Ts", "9s", "8s", "7s", "6s", "5s", "4s", "3s", "2s"];
var totalCards2 = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", '14', "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25",
	"26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51"];
var PLAYER_LIST = {};
var botName = ["Liam", "Noah", "William", "James", "Oliver", "Benjamin", "Lucas", "Elijah", "Mason", "Logan", "Alexander", "Ethan", "Jacob", "Michael", "Daniel", "Henry",
	"Jackson", "Sebastian", "Aiden", "Matthew", "Samuel", "David", "Joseph", "Carter", "Owen", "Wyatt", "John", "Jack", "Luke", "Jayden", "Dylan", "Grayson", "Levi",
	"Issac", "Gabriel", "Julian", "Mateo", "Anthony", "Jaxon", "Lincoln", "Joshua", "Christopher",
	"Andrew", "Theodore", "Caleb", "Ryan", "Asher", "Nathan", "Thomas", "Leo"];

const mysql = require('mysql');
const pool = mysql.createPool({
	host: '81.16.28.52',
	user: 'u747351128_ludo1',
	password: '123456789Ha',
	database: 'u747351128_ludo',
});

app.get("/online", function (req, res) {
	res.json(clients);
});

function FindPlayerStart(cValue) {
	cValue += 1;
	for (var i in socketInfo) {
		var lSocket = socketInfo[i];
		if (lSocket.seat) {

		}
	}
}

setInterval(function () {
	var l = 0;
	for (var i in socketInfo) {
		var lSocket = socketInfo[i];
		if (lSocket.socket.adapter.rooms[lSocket.room] != undefined) {
			lSocket.socket.adapter.rooms[lSocket.room].searchOne = 0;
		}
	}
	for (var i in socketInfo) {
		var lSocket = socketInfo[i];
		var socRoom = lSocket.socket.adapter.rooms[lSocket.room];
		if (socRoom != undefined) {
			if (socRoom.play == 1 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				socRoom.waitingCount += 1;
				if (socRoom.waitingCount >= 3) {
					socRoom.waitingCount = 0;
					socRoom.play = 2;
					lSocket.socket.emit("StartPlay", {
						currPlay: socRoom.currPlay
					});
					lSocket.socket.broadcast.in(lSocket.room).emit("StartPlay", {
						currPlay: socRoom.currPlay
					});
				}
			} else if (socRoom.play == 2 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				socRoom.GameTimer += 1;
				lSocket.socket.emit("GameTimerCount", {
					GameTimer: socRoom.GameTimer, currPlay: socRoom.currPlay
				});
				lSocket.socket.broadcast.in(lSocket.room).emit("GameTimerCount", {
					GameTimer: socRoom.GameTimer, currPlay: socRoom.currPlay
				});

				if (socRoom.GameTimer == 10) {
					//socRoom.play = 3;
					lSocket.socket.emit("TimeOver", {});
					lSocket.socket.broadcast.in(lSocket.room).emit("TimeOver", {});
				}
			} else if (socRoom.play == 3 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				socRoom.waitingCount += 1;
				if (socRoom.waitingCount == 1) {
					lSocket.socket.emit("Disable", {
						seat: (lSocket.seat - 1),
						currPlay: socRoom.currPlay
					});
					lSocket.socket.broadcast.in(lSocket.room).emit("Disable", {
						seat: (lSocket.seat - 1),
						currPlay: socRoom.currPlay
					});
				}
				if (socRoom.waitingCount >= 2) {
					Find_NextPlayer(socRoom, lSocket);
					socRoom.waitingCount = 0;
					socRoom.GameTimer = 0;
					socRoom.play = 2;
					lSocket.socket.emit("StartPlay", {
						currPlay: socRoom.currPlay
					});
					lSocket.socket.broadcast.in(lSocket.room).emit("StartPlay", {
						currPlay: socRoom.currPlay
					});
				}
			}
		}
	}

	//Remove Player
	/*for (var k in socketInfo) {
		var lSocket = socketInfo[k];
		var socRoom = lSocket.socket.adapter.rooms[lSocket.room];
		//console.log("inimel "+lSocket.seat);
		if (socRoom != undefined) {
			if (socRoom.play >= 3 && lSocket.removePlayer == 1) {
				lSocket.fold = 1;
				lSocket.socket.emit("FOLD", {
					seat: (lSocket.seat - 1)
				});
				lSocket.socket.broadcast.in(lSocket.room).emit("FOLD", {
					seat: (lSocket.seat - 1)
				});
				Find_NextPlayer(socRoom, lSocket);
				socRoom.gameTimer = 0;
				if (Game_Finished(lSocket) <= 1) {
					//console.log("win");
					//socRoom.play = 5;
				}
				console.log("Deleted " + lSocket.localSocketId);
				delete socketInfo[lSocket.localSocketId];
			}
		} else {
			delete socketInfo[lSocket.localSocketId];
		}
	}*/

}, 1000);


function Find_NextPlayer(socRoom, lSocket2) {
	var localCPlay = socRoom.currPlay;
	var eChe = true;
	var releaseCount = 0;
	while (eChe) {
		socRoom.currPlay += 1;
		if (socRoom.currPlay >= 4)
			socRoom.currPlay = 0;
		for (var k in socketInfo) {
			var lSocket4 = socketInfo[k];
			//console.log("cc " + socRoom.curPlyValue + " " + (lSocket4.seat - 1));
			if (socRoom.currPlay == (lSocket4.seat - 1) && lSocket2.room == lSocket4.room &&
				localCPlay != socRoom.currPlay && lSocket4.wait == 0) {
				eChe = false;
				console.log("curr2 " + socRoom.currPlay);
			}
		}
		releaseCount += 1;
		if (releaseCount >= 5)
			eChe = false;
	}
	console.log("curr " + socRoom.currPlay);

}

function Find_Win(lSocket2) {
	var tPlayer = 0;
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		if (lSocket2.room == lSocket4.room && lSocket4.win >= 1 && lSocket4.wait == 0) {
			tPlayer += 1;
		}
	}
	return tPlayer;
}
function SetCurrBet(lSocket2) {
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		if (lSocket2.room == lSocket4.room)
			lSocket4.currBet = 0;
	}
}
function round_Finished(socRoom, lSocket2) {
	var localCPlay = socRoom.currPlay;
	var localCPlay2 = socRoom.currPlay;
	var eChe = true;
	var releaseCount = 0;
	while (eChe) {
		localCPlay2 -= 1;
		if (localCPlay2 < 0)
			localCPlay2 = 5;
		for (var k in socketInfo) {
			var lSocket4 = socketInfo[k];
			//console.log("cc " + socRoom.curPlyValue + " " + (lSocket4.seat - 1));
			if (localCPlay2 == (lSocket4.seat - 1) && lSocket4.fold == 0 && lSocket4.allin == 0 && lSocket2.room == lSocket4.room &&
				localCPlay != localCPlay2 && lSocket4.wait == 0)
				eChe = false;
		}
		releaseCount += 1;
		if (releaseCount >= 7)
			eChe = false;
	}
	socRoom.round_end = localCPlay2;
}

function check_lastRound(socRoom, lSocket) {
	if (socRoom.currPlay == socRoom.round_end) {
		if (socRoom.centerCardValue <= 2) {
			socRoom.centerCardOpenChe = true;
			socRoom.play = 4;
			socRoom.centerCardValue += 1;
			lSocket.socket.emit("CenterCardOpen", {
				centerCardValue: socRoom.centerCardValue,
				seat: (lSocket.seat - 1),
				potValue: socRoom.potValue
			});
			lSocket.socket.broadcast.in(lSocket.room).emit("CenterCardOpen", {
				centerCardValue: socRoom.centerCardValue,
				seat: (lSocket.seat - 1),
				potValue: socRoom.potValue
			});
		} else {
			console.log("win");
			socRoom.centerCardOpenChe = true;
			socRoom.play = 5;
		}
	}
}
function check_lastRound2(socRoom, lSocket) {
	if (socRoom.centerCardValue <= 2) {
		socRoom.centerCardOpenChe = true;
		socRoom.centerCardValue += 1;
		lSocket.socket.emit("CenterCardOpen", {
			centerCardValue: socRoom.centerCardValue,
			seat: (lSocket.seat - 1),
			potValue: socRoom.potValue
		});
		lSocket.socket.broadcast.in(lSocket.room).emit("CenterCardOpen", {
			centerCardValue: socRoom.centerCardValue,
			seat: (lSocket.seat - 1),
			potValue: socRoom.potValue
		});
	}
}
function Game_Finished(lSocket) {
	var reCount = 0;
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		//console.log("cc " + socRoom.curPlyValue + " " + (lSocket4.seat - 1));
		if (lSocket.room == lSocket4.room && lSocket4.fold == 0 && lSocket4.wait == 0)
			reCount += 1;
	}
	return reCount;
}
function Player_Count(lSocket) {
	var reCount = 0;
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		if (lSocket.room == lSocket4.room)
			reCount += 1;
	}
	return reCount;
}

io.on('connection', function (socket) {

	console.log("server connected");
	socket.on("StartGame", function () {
		socket.emit("Server_Started", {});
	});

	socket.on("Room", function (data) {
		var alreadyPlay = false;
		if (alreadyPlay) {
			//socket.emit("AlreadyPlay", {});
		} else {
			var ch2 = true;
			var roomStart = 1;
			var roomEnd = 100;
			if (parseInt(data.player_count) == 4) {
				roomStart = 101;
				roomEnd = 200;
			}
			var i = parseInt(data.room);
			console.log("room "+i);
			var roomSocket = io.sockets.adapter.rooms[i + ""];
			if (roomSocket == undefined) {
				socket.join(i + "");
				socket.emit("RoomConnected", { room: parseInt(i + "") });
				socket.adapter.rooms[i + ""].dealerValue = 2;
				socket.adapter.rooms[i + ""].currPlay = 0;
				socket.adapter.rooms[i + ""].play = 0;
				socket.adapter.rooms[i + ""].searchOne = 0;
				socket.adapter.rooms[i + ""].waitingCount = 0;
				socket.adapter.rooms[i + ""].startBetAmount = parseInt(data.startBet);
				socket.adapter.rooms[i + ""].player_count = parseInt(data.player_count);
				socket.adapter.rooms[i + ""].GameTimer = 0;
				socket.adapter.rooms[i + ""].winCount = 0;
				ch2 = false;
			} else {
				if (roomSocket.length < parseInt(data.player_count)) {
					socket.join(i + "");
					socket.emit("RoomConnected", { room: parseInt(i) });
					ch2 = false;
				}
			}

		}
	});

	socket.on("PlayerJoin", function (data) {
		var soRoom = socket.adapter.rooms[data.room];
		for (var j = 0; j < 1; j++) {
			var socId;
			if (j == 0)
				socId = socket.id;
			else if (j == 1 || j == 2)
				socId = socket.id + j;
			socketInfo[socId] = [];
			socketInfo[socId].socket = socket;
			socketInfo[socId].name = data.name;
			socketInfo[socId].points = parseInt(data.points);
			socketInfo[socId].room = data.room;
			socketInfo[socId].localSocketId = socId;
			socketInfo[socId].win = 0;
			socketInfo[socId].commission = parseInt(data.commission);
			socketInfo[socId].removePlayer = 0;
			socketInfo[socId].entryPoint = parseInt(data.entryPoint);
			socketInfo[socId].winPoint = parseInt(data.winPoint);
			if (soRoom.play >= 1)
				socketInfo[socId].wait = 1;
			else
				socketInfo[socId].wait = 0;

			var ch2 = true;
			let floop;
			if (soRoom.player_count == 2)
				floop = [1, 2];
			else
				floop = [1, 2, 3, 4];
			for (let i of floop) {
				if (ch2) {
					var seatAvailable = false;
					for (var k in socketInfo) {
						var lSocket = socketInfo[k];
						if (i == lSocket.seat && data.room == lSocket.room)
							seatAvailable = true;
					}
					if (!seatAvailable) {
						ch2 = false;
						socketInfo[socId].seat = i;
					}
				}
			}
			console.log("seat " + (socketInfo[socId].seat - 1) + " " + socketInfo[socId].room + " " + soRoom.player_count);
			for (var k in socketInfo) {
				var lSocket = socketInfo[k];
				lSocket.socket.emit("PlayerJoin", {
					seat: (lSocket.seat - 1),
					name: lSocket.name,
					points: lSocket.points,
					wait: lSocket.wait
				});
				lSocket.socket.broadcast.in(lSocket.room).emit("PlayerJoin", {
					seat: (lSocket.seat - 1),
					name: lSocket.name,
					points: lSocket.points,
					wait: lSocket.wait
				});
			}
		}
		socket.emit("YOU", { seat: (socketInfo[socket.id].seat - 1), wait: socketInfo[socket.id].wait });

		if (socketInfo[socket.id].wait == 1) {
			for (var k in socketInfo) {
				var lSocket4 = socketInfo[k];
				if (lSocket4.room == data.room) {
					socket.emit("WatchPlayerJoin", {
						seat: (lSocket4.seat - 1),
						name: lSocket4.name,
						points: lSocket4.points,
						wait: lSocket4.wait
					});
				}
			}
		}

		if (socket.adapter.rooms[data.room].play == 0 && soRoom.length >= soRoom.player_count)
			socket.adapter.rooms[data.room].play = 1;

	});
	socket.on("CLICK", function () {
		var socRoom = socketInfo[socket.id].socket.adapter.rooms[socketInfo[socket.id].room];
		socRoom.GameTimer = 0;
		var rIndex = Math.floor(Math.random() * 6);
		rIndex += 1;
		socket.emit("CLICK", {
			seat: (socketInfo[socket.id].seat - 1),
			diceRandom: rIndex
		});
		socket.broadcast.in(socketInfo[socket.id].room).emit("CLICK", {
			seat: (socketInfo[socket.id].seat - 1),
			diceRandom: rIndex
		});

	});

	socket.on("NextPlayer", function () {
		var socRoom = socketInfo[socket.id].socket.adapter.rooms[socketInfo[socket.id].room];
		//console.log("logo " + socRoom.currPlay);
		socRoom.play = 3;
		socket.emit("NextPlayer", {
			seat: (socketInfo[socket.id].seat - 1),
			currPlay: socRoom.currPlay
		});
		socket.broadcast.in(socketInfo[socket.id].room).emit("NextPlayer", {
			seat: (socketInfo[socket.id].seat - 1),
			currPlay: socRoom.currPlay
		});
	});

	socket.on("MoveArrow", function (data) {
		var socRoom = socketInfo[socket.id].socket.adapter.rooms[socketInfo[socket.id].room];
		socket.emit("MoveArrow", {
			seat: (socketInfo[socket.id].seat - 1),
			currPlay: socRoom.currPlay,
			arrowValue: data.arrowValue
		});
		socket.broadcast.in(socketInfo[socket.id].room).emit("MoveArrow", {
			seat: (socketInfo[socket.id].seat - 1),
			currPlay: socRoom.currPlay,
			arrowValue: data.arrowValue
		});
	});
	socket.on("FindWin", function (data) {
		var socRoom = socketInfo[socket.id].socket.adapter.rooms[socketInfo[socket.id].room];
		socRoom.winCount += 1;
		socketInfo[socket.id].win = socRoom.winCount;
		var wResult = Find_Win(socketInfo[socket.id]);
		var winValue = 0;
		if (socRoom.player_count == 2) {
			if (wResult >= 1) {
				winValue = 1;
				socket.emit("SaveSocket", {
					seat: (socketInfo[socket.id].seat - 1),
					name: socketInfo[socket.id].name,
					winValue: 1,
					winPoint: socketInfo[socket.id].winPoint,
					entryPoint: socketInfo[socket.id].entryPoint

				});
				socket.broadcast.in(socketInfo[socket.id].room).emit("SaveSocket", {
					seat: (socketInfo[socket.id].seat - 1),
					name: socketInfo[socket.id].name,
					winValue: 1,
					winPoint: socketInfo[socket.id].winPoint,
					entryPoint: socketInfo[socket.id].entryPoint
				});
			}
		} else if (socRoom.player_count == 4) {
			if (wResult >= 2) {
				winValue = 1;
				let floop = [1, 2];
				for (let i of floop) {
					for (var k in socketInfo) {
						var lSocket4 = socketInfo[k];
						if (lSocket4.room == socketInfo[socket.id].room && lSocket4.win == i) {
							lSocket4.socket.emit("SaveSocket", {
								seat: (lSocket4.seat - 1),
								name: lSocket4.name,
								winValue: i,
								
							});
							lSocket4.socket.broadcast.in(lSocket4.room).emit("SaveSocket", {
								seat: (lSocket4.seat - 1),
								name: lSocket4.name,
								winValue: i,
							});
						}
					}
				}
			}
		}
		socket.emit("FindWin", {
			seat: (socketInfo[socket.id].seat - 1),
			currPlay: socRoom.currPlay,
			winValue: winValue,
			name: socketInfo[socket.id].name
		});
		socket.broadcast.in(socketInfo[socket.id].room).emit("FindWin", {
			seat: (socketInfo[socket.id].seat - 1),
			currPlay: socRoom.currPlay,
			winValue: winValue,
			name: socketInfo[socket.id].name
		});
	});
	socket.on("UserRegister", function (data) {
		RegisterMySql(data, socket);
	});
	socket.on("VerifyUser", function (data) {
		VerifyUser(data, socket, 0);
	});
	socket.on("Withdraw", function (data) {
		WithdrawMongoDB(socket, data);
	});
	socket.on("UpdateChips", function (data) {
		Updated_Chips(data.email, parseInt(data.points));

	});
	socket.on("UpdateCash", function (data) {
		var poValue = parseInt(data.winPoint);
		var perc = (poValue / 100.0);
		var comm = perc * (100 - lSocket.commission);
		socketInfo[socket.id].cash += comm;
		var comm2 = perc * lSocket.commission;
		InsertCommission(socketInfo[socket.id], comm2);
		Updated_Cash(socketInfo[socket.id].email, comm);
		socket.emit("UpdateCash", {
			seat: (socketInfo[socket.id].seat - 1),
			points: comm
		});

	});
	socket.on("ReferCommission", function (data) {
		ReferCommission(data, socket);
	});
	socket.on("CreateTable", function (data) {
		PrivateTable(socket, data);
	});
	socket.on("JoinPrivateRoom", function (data) {
		JoinRoom(socket, data);
	});
	socket.on("GetDocuments", function (data) {
		GetAllDocumentMongoDB(data, socket);
	});
	socket.on("GetPrivate", function (data) {
		GetPrivateTable(data, socket);
	});
	socket.on("disconnect", function () {
		var pCount = 0;
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			console.log(socketInfo[socket.id].room);
			console.log(lSocket.room);
			if (socketInfo[socket.id].room == lSocket.room && lSocket.socket.id != socket.id)
				pCount += 1;
		}
		if (pCount == 1) {
			for (var k in socketInfo) {
				var lSocket = socketInfo[k];
				if (socketInfo[socket.id].room == lSocket.room && lSocket.socket.id != socket.id) {
					lSocket.socket.emit("SaveSocket", {
						seat: (lSocket.seat - 1),
						name: lSocket.name,
						winValue: 1,
						ccc: "cccc",
						winPoint: socketInfo[socket.id].winPoint,
						entryPoint: socketInfo[socket.id].entryPoint
					});
					lSocket.socket.broadcast.in(lSocket.room).emit("SaveSocket", {
						seat: (lSocket.seat - 1),
						name: lSocket.name,
						winValue: 1,
					});
					lSocket.socket.emit("FindWin", {
						seat: (lSocket.seat - 1),
						winValue: 1,
						name: lSocket.name
					});
					lSocket.socket.broadcast.in(lSocket.room).emit("FindWin", {
						seat: (lSocket.seat - 1),
						winValue: 1,
						name: lSocket.name
					});
				}
			}
		}
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket.socket.id == socket.id) {
				//console.log("Remove 1 " + lSocket.localSocketId);
				//lSocket.removePlayer = 1;
				delete socketInfo[lSocket.localSocketId];
			}
		}
	});
});

function RegisterMySql(data, lSocket) {
	var today = new Date();
	data.created_at = today;
	data.updated_at = today;
	data.chips = 0;
	data.cash = 0;
	data.status = "deactive";
	data.referral_code = referralCodeGenerator.alphaNumeric('uppercase', 3, 2);
	data.guest = "1";

	let hash = bcrypt.hashSync(data.password, 10);
	var post = {
		name: data.name, password: hash, username: data.username, email: data.email, chips: data.chips, cash: data.cash, referral_code: data.referral_code,
		referby_friends: data.refer, mobile: data.mobile, status: data.status, withdraw_limit: null, created_at: data.created_at, updated_at: data.updated_at,
		verify_mobile: "not_verify", dob: "", address: "", gender: "", aadhar: "", pan: "", bonus: 0
	};
	pool.query('INSERT INTO categories SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {
			console.log("user registered sucessfully " + data.email);
			VerifyUser(data, lSocket, 0);
		}
	});
}

function VerifyUser(data, lSocket, optValue) {
	var succ;
	var email = data.email;

	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		var empty = 0;
		for (var i in result) {
			const ppp = bcrypt.compareSync(data.password, result[0].password);
			if (result[i].email == email && optValue == 0 && ppp) {
				empty = 1;
				//console.log(result);
				//console.log('Post Titles: ', result[i].total_chips);
				lSocket.emit("VerifyUser", {
					name: result[i].name, email: result[i].email, total_chips: result[i].chips, cash: result[i].cash,
					status: "yes", guest: data.guest, referby_friends: result[i].referby_friends, withdraw_limit: result[i].withdraw_limit,
					mobile: result[i].mobile, verify_mobile: result[i].verify_mobile, password: data.password, referral_code: result[i].referral_code
				});
				GetCommission(lSocket);
				succ = "success";
			}
		}
		if (empty == 0 && optValue == 0)
			lSocket.emit("VerifyUser", { email: email, status: "no" });
		return empty;
	});
}
function GetCommission(lSocket) {
	pool.query("SELECT * FROM settings", function (err, result, fields) {
		lSocket.emit("Settings", {
			commission: result[0].conversion_rate, bonusRate: result[0].currency, private_price: result[0].question_time,
			upgrade_url: result[0].completed_option
		});
	});
}
function WithdrawMongoDB(lSocket, data) {

	var today = new Date();
	var post = {
		username: data.email, amount: data.withdrawAmt, status: "Pending", bankname: data.bankname, accountnumber: data.accountnumber, ifsc: data.ifsc,
		created_At: today, updated_at: today
	};
	pool.query('INSERT INTO withdrawals SET ?', post, function (error, result, fields) {
		if (error) {
			lSocket.emit("Withdraw", { status: "failed" });
		} else {
			lSocket.emit("Withdraw", { status: "success" });
			Updated_Cash(lSocket, data.email, -parseInt(data.withdrawAmt));
		}
	});
}
function Updated_Chips(email, chips) {
	var sql = "UPDATE categories set chips = ? WHERE email = ?";
	pool.query(sql, [chips, email], function (err, result) {
		//lSocket.socket.emit("Update_Total_Chips", { seat: (lSocket.seat - 1), total_chips: chips });
	});
}
function Updated_Cash(lSocket, email, cash) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		for (var i in result) {
			if (result[i].email == email) {
				var rCash = result[i].cash;
				rCash += cash;
				Updated_Cash2(lSocket, email, rCash);
			}
		}
	});
}
function Updated_Cash2(lSocket, email, cash) {
	var sql = "UPDATE categories set cash = ? WHERE email = ?";
	pool.query(sql, [cash, email], function (err, result) {
		//console.log("updated " + result);
		lSocket.socket.emit("Update_Cash", { seat: (lSocket.seat - 1), cash: lSocket.cash });
	});
}
function ReferCommission(data, lSocket) {
	var sql = 'SELECT * FROM settings WHERE referby_friends = ?';
	pool.query(sql, [data.referby_friends], function (error, result, fields) {
		for (var i in result) {
			if (result[i].referby_friends == data.referby_friends) {
				var pCount = result[i].cash;
				pCount += parseInt(data.commission);
				ReferCommission2(pCount, data, lSocket);
			}
		}
	});
}
function ReferCommission2(cashPlusCommission, data, lSocket) {
	var sql = "UPDATE categories set cash = ? WHERE referral_code = ?";
	pool.query(sql, [cashPlusCommission, data.referby_friends], function (err, result) {
		if (!err) {
			lSocket.emit("CommissionSuccess", {});
		}
	});
}
function InsertCommission(lSocket, comm) {
	var today = new Date();
	var post = {
		method: lSocket.username, commission: comm, game_name: "Ludo",
		created_At: today, updated_at: today
	};
	pool.query('INSERT INTO payment_methods SET ?', post, function (error, result, fields) {
		if (error) {
		} else {
		}
	});
}
function GetAllDocumentMongoDB(data, lSocket) {

	pool.query("SELECT * FROM players", function (err, result, fields) {
		var empty = 0;
		for (var i = 0; i < result.length; i++) {
			var roomCount = io.sockets.adapter.rooms[result[i].id];
			var rValue;
			if (roomCount != undefined)
				rValue = roomCount.length;
			else
				rValue = 0;
			lSocket.emit("GetDocuments", {
				id: result[i].id, username: result[i].username, BootValue: result[i].bootvalue, MaxBlind: result[i].maxblind,
				tablename: "Normal", players: rValue, tableType: result[i].expiredays, status: "yes"
			});
			empty = 1;
		}
		if (empty == 0) {
			lSocket.emit("GetDocuments", { status: "no" });
		}
	});
}
function GetPrivateTable(data, lSocket) {
	var sql = 'SELECT * FROM private_table WHERE email = ?';
	pool.query(sql, [data.email], function (error, result, fields) {
		var empty = 0;
		for (var i = 0; i < result.length; i++) {
			if (result[i].table_player == "2" || result[i].table_player == "4") {
				var roomCount = io.sockets.adapter.rooms[result[i].id];
				lSocket.emit("GetDocuments", {
					id: result[i].room_id, BootValue: result[i].boot_value, MaxBlind: result[i].max_blind,
					tablename: result[i].room_id, tableType: result[i].table_player, status: "yes"
				});
				empty = 1;
			}
		}
		if (empty == 0) {
			lSocket.emit("GetDocuments", { status: "no" });
		}
	});
}
function PrivateTable(lSocket, data) {
	var today = new Date();
	var rValue = Math.floor(Math.random() * 90000);
	rValue += 10000;
	var post = {
		room_id: rValue, email: data.email, table_name: "private", boot_value: parseInt(data.BootAmt), max_blind: parseInt(data.MaxBlind), table_player: data.tableType,
		created_At: today
	};
	pool.query('INSERT INTO private_table SET ?', post, function (error, result, fields) {
		if (error) {

		} else {
			lSocket.emit("CreateTable", { room_id: rValue });
			Updated_Chips(data.email, parseInt(data.ptprice));
		}
	});
}
function JoinRoom(lSocket, data) {
	var sql = 'SELECT * FROM private_table WHERE room_id = ?';
	pool.query(sql, [data.room_id], function (error, result, fields) {
		if (error) {
			console.log("avai 1");
			lSocket.emit("JoinPrivateRoom", { status: "no" });
		} else {
			console.log("avai 2");
			for (var i in result)
				lSocket.emit("JoinPrivateRoom", { id: result[i].room_id, BootValue: result[i].boot_value, MaxBlind: result[i].max_blind, tablePlayer: result[i].table_player, status: "yes" });

			if (result.length == 0) {
				lSocket.emit("JoinPrivateRoom", { status: "no" });
			}

		}
	});
}

listOfUsers = function () {
	for (var i = 0; i < clients.length; i++) {
		console.log("Now " + clients[i].name + " ONLINE");
	}
}

server.listen(app.get('port'), function () {
	console.log("Server is Running : " + server.address().port);
});








