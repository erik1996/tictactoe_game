let room;
var socket = io.connect('http://localhost:3000');
$(document).ready(function () {
    $('.container-new-game').on('click', function () {
        socket.emit('creat-room');
    });
    socket.on('room-created', function (roomId) {
        $('.home-section').hide();
        $('#room-id').html(roomId);
        $('.waiting-section').show();
        room = roomId;
    });
    $('.btn-join ').on('click', function () {
        const roomId = $('.room-id').val();
        socket.emit('join-room', roomId);
    });
    socket.on('game-start', function (roomId, socketId) {
        $('.home-section').hide();
        $('.waiting-section').hide();
        $('.game-section').show();
        if (socketId == socket.id) {
            $('.icon-box').html('Your icon O');
        } else {
            $('.icon-box').html('Your icon X');
        }
        $('.turn-box').html('The next turn is X');
        room = roomId;
    });
    $('table').on('click', function (e) {
        let squareId = e.target.id;
        if (!$('#' + squareId).html()) {
            socket.emit('step', room, squareId);
        }
    });
    socket.on('add-step', function (squareId, icon, winner) {
        var square = $('#' + squareId);
        if (icon === 'X') {
            $('.turn-box').html('The next turn is O');
            $(square).html(icon).css('color', 'red');
        } else {
            $('.turn-box').html('The next turn is X');
            $(square).html(icon).css('color', 'blue');
        }
        if (winner == 'DRAW') {
            $('.box-alret-winner').css('display', 'flex');
            $('.winner-text').html(winner);
        } else if (winner) {
            $('.box-alret-winner').css('display', 'flex');
            $('.winner-text').html('Winner ' + icon);
        }
    });
    $('.restart-btn').on('click', function () {
        socket.emit('new-game', room);
    });
    socket.on('start-new-game', function () {
        let step = 0;
        $('.square').html('');
        $('.box-alret-winner').hide();
        $('.turn-box').html('The next turn is X');
    });
});
