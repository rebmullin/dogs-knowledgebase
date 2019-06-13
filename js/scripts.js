let configSettings = window.config || null;

let dogs = (function(configSettings) {
  const clientId = Boolean(configSettings) ? configSettings.CLIENT_ID : null;
  const clientSecret = Boolean(configSettings)
    ? configSettings.CLIENT_SECRET
    : null;

  const apiUrl = "https://api.petfinder.com/v2/animals?breed=Bichon Frise";
  const tokenUrl = "https://api.petfinder.com/v2/oauth2/token";

  function showLoadingMessage() {
    $("body").append(
      '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>'
    );
  }

  function removeLoadingMessage() {
    $("body .spinner-border").remove();
  }

  function getToken() {
    if (Cookies.get("token")) {
      return Promise.resolve(Cookies.get("token"));
    }

    return $.ajax({
      url: tokenUrl,
      type: "POST",
      data: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      success: response => {
        const { access_token: token } = response;
        const nowPlusHour = 1 / 24; // expire cookie in an hour
        Cookies.set("token", token, { expires: nowPlusHour });

        // shouldn't this return a string? it seems to return an object :/
        // what am I missing?
        return token;
      },
      error: error => {
        console.error(error);
        $("body").append(
          `<div class="loading-error"><p>oh no!!!!!</p><p>${error &&
            error.responseJON &&
            error.responseJSON.detail}</p></div>`
        );
        Cookies.remove("token");
        removeLoadingMessage();
      }
    });
  }

  function loadDogs() {
    showLoadingMessage();

    getToken().then(token => {
      $.ajax({
        url: apiUrl,
        type: "GET",
        crossDomain: true,
        beforeSend: xhr => {
          let bearerToken = token;

          if (typeof token === "object") {
            bearerToken = token.access_token;
          }

          xhr.setRequestHeader("Authorization", `Bearer ${bearerToken}`);
        },

        success: data => {
          const { animals } = data;
          animals.forEach((animal, index) => {
            addDogItem(animal, index);
          });

          $(".list-item-group").on("click", function(e) {
            const index = $(this).data("name");
            showModal(animals[index], index);
          });
        },
        error: error => {
          console.error(error);
          $("body").append(
            `<div class="loading-error"><p>oh no!!</p><p>${
              error.statusText
            }</p></div>`
          );
          // remove old token
          Cookies.remove("token");
          getToken();
        },

        complete: function() {
          removeLoadingMessage();
        }
      });
    });
  }

  function showModal(item, index) {
    $(".modal").attr("id", `dog-${index}`);

    // Add the dog's details

    // modal header
    const $modalHeader = $(".modal-header");
    // Clear out title before adding anything again
    $modalHeader.find(".modal-header__title").remove();
    $modalHeader.prepend(
      `<h4 class="modal-header__title text-center">${item.name}</h4>`
    );

    // modal body
    const $modalBody = $(".modal-body");
    // Clear out body before adding anything again
    $modalBody.empty();

    if (item.photos.length) {
      $modalBody.append(
        `<img class="rounded mx-auto d-block p-3" src="${
          item.photos[0].medium
        }" alt="${item.name}" />`
      );
    }
    if (item.description) {
      $modalBody.append(`<p>${item.description}</p>`);
    }

    $modalBody.append(
      `<a class="text-align" href="${item.url}">Find out more about ${
        item.name
      } here!</a>`
    );
  }

  function addDogItem(item, index) {
    $(".dog-display .list-group").append(
      `<button data-toggle="modal" data-name="${index}"
      data-target="#dog-${index}" class="list-item-group m-3 btn btn-primary">${
        item.name
      }</button>`
    );
  }

  return {
    loadDogs: loadDogs
  };
})(configSettings);

if (!configSettings) {
  $("body").append(
    `<div class="loading-error"><p>oh no!!</p><p>Sorry, you do not have access to this API!</p></div>`
  );
} else {
  dogs.loadDogs();
}
