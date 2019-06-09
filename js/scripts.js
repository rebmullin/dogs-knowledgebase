let dogs = (function(config) {
  const clientId = config ? config.CLIENT_ID : null;
  const clientSecret = config ? config.CLIENT_SECRET : null;

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
    return $.ajax({
      url: tokenUrl,
      type: "POST",
      // I am guessing this is bad to run if we already have a token, right?
      // What is the best way to handle storing this token? cookie? localStorage??
      // so we don't have to keep fetching this (unless it's needed - it's expired)??
      data: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      success: token => token,
      error: error => {
        console.error(error);
        $("body").append(
          `<div class="loading-error"><p>oh no!!</p><p>${
            error.responseJSON.detail
          }</p></div>`,
        );
        removeLoadingMessage();
      },
    });
  }

  function loadDogs() {
    showLoadingMessage();

    // Also I am guessing this is bad to run if we already have a token to ask for another one??. how to this - handle storing token? cookie? localStorage??
    getToken().then(data => {
      const { access_token: token } = data;
      $.ajax({
        url: apiUrl,
        type: "GET",
        beforeSend: xhr => {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
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
          console.log(error);
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

    $modalDetailWrapper.append(
      `<p class="modal-detail__description">${item.description}</p>`,
    );

    $modalDetailWrapper.append(
      `<a class="modal-detail__link" href="${item.url}">Find out more about ${
        item.name
      } here!</a>`,
    );

    $modalWrapper.addClass("modal-wrapper--show");
  }

  $(window).on("keydown", function(e) {
    if (e.key === "Escape" && $modalWrapper.hasClass("modal-wrapper--show")) {
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
    $modalWrapper.removeClass("modal-wrapper--show");
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
})(config);

dogs.loadDogs();
