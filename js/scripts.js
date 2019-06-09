let configSettings = window.config || null;

let dogs = (function(configSettings) {
  const clientId = Boolean(configSettings) ? configSettings.CLIENT_ID : null;
  const clientSecret = Boolean(configSettings)
    ? configSettings.CLIENT_SECRET
    : null;

  const apiUrl = "https://api.petfinder.com/v2/animals?breed=Bichon Frise";
  const tokenUrl = "https://api.petfinder.com/v2/oauth2/token";

  const $modalWrapper = $(".modal-wrapper");

  function showLoadingMessage() {
    $("body").append('<p class="loading">Loading...</p>');
  }

  function removeLoadingMessage() {
    $("body .loading").remove();
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
            error.responseJSON.detail}</p></div>`,
        );
        Cookies.remove("token");
        removeLoadingMessage();
      },
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

          $(".dog-list__item").on("click", function(e) {
            const index = $(this).data("name");
            showModal(animals[index]);
          });
        },
        error: error => {
          console.error(error);
          $("body").append(
            `<div class="loading-error"><p>oh no!!</p><p>${
              error.statusText
            }</p></div>`,
          );
          // remove old token
          Cookies.remove("token");
          getToken();
        },

        complete: function() {
          removeLoadingMessage();
        },
      });
    });
  }

  function showModal(item) {
    $modalWrapper.append('<div class="modal"></div>');

    const $modal = $(".modal");
    $modal.append('<button class="modal-close"></button>');

    const $modalCloseButton = $(".modal-close");

    $modalCloseButton.on("click", hideModal);

    // Add the dog's details
    $modal.append('<div class="modal-detail-wrapper"></div');

    const $modalDetailWrapper = $(".modal-detail-wrapper");

    $modalDetailWrapper.append(
      `<h1 class="modal-detail__name">${item.name}</h1>`,
    );
    if (item.photos.length) {
      $modalDetailWrapper.append(
        `<img class="modal-detail__image" src="${item.photos[0].medium}" alt="${
          item.name
        }" />`,
      );
    }

    if (item.description) {
      $modalDetailWrapper.append(
        `<p class="modal-detail__description">${item.description}</p>`,
      );
    }

    $modalDetailWrapper.append(
      `<a class="modal-detail__link" href="${item.url}">Find out more about ${
        item.name
      } here!</a>`,
    );

    $modalWrapper.velocity(
      { opacity: 1, visibility: "visible" },
      { duration: 1000 },
    );
  }

  $(window).on("keydown", function(e) {
    if (e.key === "Escape" && $modalWrapper.hasClass("modal-wrapper")) {
      hideModal();
    }
  });

  $modalWrapper.on("click", function(e) {
    const target = e.target;
    if (target === $(this)[0]) {
      hideModal();
    }
  });

  function hideModal() {
    const $modalWrapper = $(".modal-wrapper");
    $modalWrapper.velocity(
      { opacity: 0, visibility: "hidden" },
      { duration: 1000 },
    );
    $modalWrapper.empty();
  }

  function addDogItem(item, index) {
    $(".dog-list").append(
      `<li class="dog-list__item" data-name="${index}"><button>${
        item.name
      }</button></li>`,
    );
  }

  return {
    loadDogs: loadDogs,
  };
})(configSettings);

if (!configSettings) {
  $("body").append(
    `<div class="loading-error"><p>oh no!!</p><p>Sorry, you do not have access to this API!</p></div>`,
  );
} else {
  dogs.loadDogs();
}
