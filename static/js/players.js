var PLAYERS_REGISTERED_ID = "#players_registered";
var checkForRegisteredPlayersInterval;

function setupCheckForRegisteredPlayers(onSuccess) {
    stopCheckForRegisteredPlayers();

    checkForRegisteredPlayersInterval = setInterval(function () {
        $.ajax({
            type: "GET",
            url: "players",
            success: function(data) {
                onSuccess(data.total_registered_players);
            },
            error: function(error) {
                onError(error);
            }
        });
    }, 1000);
}

function stopCheckForRegisteredPlayers() {
    if ( checkForRegisteredPlayersInterval) {
        clearInterval(checkForRegisteredPlayersInterval);
    }
}

function onError(error) {
    console.log("An error occurred getting player registrations info: "+error);
}

