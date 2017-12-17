var boardTimestamp;
var metadataObject;

var timeBetweenUpdateChecks = 3000;
var updateCheckerID = setInterval(ajaxCheckIfShouldUpdateBoard, timeBetweenUpdateChecks);

// Drag and drop start
function allowDrop(ev)
{
  ev.preventDefault();
}

function drag(ev)
{
  console.log("Drag start");

  var categoryId = ev.currentTarget.parentElement.id;

  console.log(ev.target.id + " is being dragged.");

  ev.dataTransfer.setData("cardId", ev.target.id);
}

function drop(ev)
{
  ev.preventDefault();

  var dragTarget = ev.dataTransfer.getData("cardId");
  var cardElement = document.getElementById(dragTarget);

  // This makes it so that the add/remove only happens if the
  // card was actually moved to another drop zone.
  if(cardElement.parentNode != ev.currentTarget)
  {
    var targetCategoryId = ev.currentTarget.getAttribute("category_id");
    var targetSwimlaneId = ev.currentTarget.getAttribute("swimlane_id");
    var cardId = cardElement.getAttribute("card_id");

    // We need to actually set it to null, otherwise we'd be sending
    // a string with the value of "null".
    if(targetSwimlaneId === "null") {
      targetSwimlaneId = null;
    }

    ajaxUpdateCard(cardId, targetCategoryId, targetSwimlaneId);

    // This changes the "Last Updated: " value to Today.
    if(cardElement.getElementsByClassName('cardLastUpdated')[0].innerHTML.trim() != "Today")
    {
      cardElement.getElementsByClassName('cardLastUpdated')[0].innerHTML = "Today";
    }

    ev.currentTarget.appendChild(cardElement);
  }

  console.log("Drag end");
}

// As there's a possibility that the user drops the card in a non-droppable
// area we have to account for this.
document.addEventListener('dragend', function(event) {
  // dropEffect is set to "move" if the card was moved and set to "none"
  // if it was dropped in a area other than a dropzone.
  if(event.dataTransfer.dropEffect == "none")
  {
    console.log("Drag cancelled");
  }
});
// Drag and drop end

// Ajax related functions start
$.ajaxSetup({
  headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
  }
});

function ajaxUpdateCard(id, category_id, swimlane_id)
{
  console.log("id: " + id + "\n category_id: " + category_id + "\n swimlane_id: " + swimlane_id);
  $.ajax({
    url: "/api/cards/" + id,
    data: {
      category_id: category_id,
      swimlane_id: swimlane_id
    },
    method: "PUT",
    success: function( result ) {
      setBoardTimestamp(result["timestamp"]);
    }, error: function (xhr, ajaxOptions, thrownError){
      $jsonXHR = JSON.stringify(xhr.responseText);
      console.log(JSON.parse($jsonXHR));
    }
  });
};

/*
  I do it in this separate way so that we don't have to download all cards
  every time we want to look for an update.
  Card data downloads can really add up as we are checking often.
  This way we only fetch and parse a boolean response.
*/
function ajaxCheckIfShouldUpdateBoard()
{
  $.ajax({ url: "api/cards/updatedsince/" + boardTimestamp,
    data: {
      timestamp: boardTimestamp,
      metadataObject: metadataObject
    },
    method: "POST",
    success: function(data) {
      if(data['response'] == 1)
      {
        setBoardTimestamp(data['timestamp']);
        setBoardMetadata(data['metadataObject']);
        ajaxGetBoard();
      }
    },
    error: function (xhr, ajaxOptions, thrownError) {
      $jsonXHR = JSON.stringify(xhr.responseText);
      console.log(JSON.parse($jsonXHR));
    }
  });
}

function ajaxGetBoard()
{
  $.ajax({ url: "board/",
    method: "GET",
    success: function(data) {
      $(".tbl-board").replaceWith($(data).find(".tbl-board"));
    },
    error: function (xhr, ajaxOptions, thrownError) {
      $jsonXHR = JSON.stringify(xhr.responseText);
      console.log(JSON.parse($jsonXHR));
    }
  });
}

function ajaxGetCard(id)
{
  $.ajax({ url: "/api/cards/" + id,
    method: "GET",
    success: function( result ) {
      //$('#returnValue').html('<pre>' + JSON.stringify(result, null, 2) + '</pre>');
      console.log(JSON.stringify(result, null, 2));
    }
  });
}

function setBoardTimestamp(timestamp)
{
  boardTimestamp = timestamp;
}

function setBoardMetadata(metadata)
{
  metadataObject = metadata;
}
