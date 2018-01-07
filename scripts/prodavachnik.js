function startApp() {
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_H1gBME7wb";
    const kinveyAppSecret = "da5b3759bb1c4007bbe2d84bedcda320";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };
    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewHome');

    // $('#formLogin').submit(loginUser)

    $('form').submit(function (e) {e.preventDefault()});


    $('#linkHome').click(showHomeView);
    $('#linkLogin').click(showLoginView);
    $('#linkRegister').click(showRegisterView);
    $('#linkListAds').click(listAd); //TODO LISTING

    $('#linkCreateAd').click(showCreateAdsView);
     $('#linkLogout').click(logoutUser); //TODO LOGOUT

    // TODO LOGIN AND REGISTER
     $('#buttonLoginUser').click(loginUser);
     $('#buttonRegisterUser').click(registerUser);
    //TODO
     $('#buttonCreateAd').click(createAd);
     $('#buttonEditAd').click(editAd);

    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });



    function showHideMenuLinks() {
        $('#linkHome').show();
        if(sessionStorage.getItem('authToken')){
            //logged user
            $('#linkLogin').hide();
            $('#linkRegister').hide();
            $('#linkListAds').show();
            $('#linkCreateAd').show();
            $('#linkLogout').show();
        }else{ // no logged user
            $('#linkLogin').show();
            $('#linkRegister').show();
            $('#linkListAds').hide();
            $('#linkCreateAd').hide();
            $('#linkLogout').hide();
        }
    }

    function showView(viewName) {
        $('main > section').hide();
        $('#' + viewName).show();
    }
    function showHomeView() {
        showView('viewHome')
    }
    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }
    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }
    function showCreateAdsView() {
        $('#formCreateAd').trigger('reset');
        showView('viewCreateAd');
    }

    function loginUser() {
        let userData={
            username:$('#formLogin input[name=username]').val(),
            password:$('#formLogin input[name=passwd]').val()
        };
        $.ajax({
            method:'POST',
            url:kinveyBaseUrl + 'user/' + kinveyAppKey + '/login',
            headers:kinveyAppAuthHeaders,
            data:userData,
            success:loginSuccess,
            error:handleAjaxError
        });
        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listAd();
            showInfo('Login successful.')
        }
    }

    function registerUser() {
        let userData={
            username:$('#formRegister input[name=username]').val(),
            password:$('#formRegister input[name=passwd]').val()
        };
        $.ajax({
            method:'POST',
            url:kinveyBaseUrl + 'user/' + kinveyAppKey + '/',
            headers:kinveyAppAuthHeaders,
            data:userData,
            success:registerSuccess,
            error:handleAjaxError
        });
        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listAd();
            showInfo('User registration successful.');
        }
    }
    function saveAuthInSession(userInfo) {
            let userAuth=userInfo._kmd.authtoken;
            sessionStorage.setItem('authToken',userAuth);
            let userId=userInfo._id;
            sessionStorage.setItem('userId',userId);
            let username=userInfo.username;
            sessionStorage.setItem('username',username);
            $('#loggedInUser').text('Welcome, ' + username + '!').show()
        }
    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON && response.responseJSON.description)
            errorMsg = response.responseJSON.description;
            showError(errorMsg);
    }
    function logoutUser() {
        sessionStorage.clear();
        $('#loggedInUser').text("");
        showHideMenuLinks();
        showView('viewHome');
        showInfo('Logout successful.');
    }
    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        },3000)
    }
    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }
    

    function listAd() {
        $('#ads').empty()// TODO moje da bugne tablicata
        showView('viewAds');
        $.ajax({
            method:'GET',
            url:kinveyBaseUrl + 'appdata/' + kinveyAppKey + '/ads',
            headers:getKinveyUserAuthHeaders(),
            success:loadAdSuccess,
            error:handleAjaxError
        });
        function loadAdSuccess(ads) {
            showInfo('Ads loaded.');
            if(ads.length==0){
                $('#ads').text('No Advertisments in database');
            }else{
                let adsTable=$('<table>')
                    .append($('<tr>').append(`<th>Title</th><th>Publisher</th><th>Description</th><th>Price</th><th>Date Published</th><th>Actions</th>`));
                for (let ad of ads) {
                    appendAdRow(ad,adsTable);
                    $('#ads').append(adsTable);
                }
                function appendAdRow(ad,adsTable) {
                    let links=[];
                    //TODO :Actions links will come later
                    if(ad._acl.creator === sessionStorage['userId']){
                        let deleteLink=$('<a href="#">[Delete]</a>')
                            .click(deleteAd.bind(this,ad));
                        let readLink=$('<a href="#">[ReadMore]</a>')
                            .click(readAd.bind(this,ad));
                        let editLink=$('<a href="#">[Edit]</a>')
                            .click(loadAdForEdit.bind(this,ad));
                        links=[deleteLink, ' ', editLink, ' ',readLink];
                    }
                    //TODO VIEWMORE Raboti !!!
                    if(ad._acl.creator !== sessionStorage['userId'])
                    {
                        let readLink=$('<a href="#">[ReadMore]</a>')
                            .click(readAd.bind(this,ad));
                        links=[readLink];
                    }
                    //TODO

                    adsTable.append($('<tr>').append(
                        $('<td>').text(ad.title),
                        $('<td>').text(ad.publisher),
                        $('<td>').text(ad.description),
                        $('<td>').text(ad.price),
                        $('<td>').text(ad.date),

                        $('<td>').append(links)
                    ))
                }
            }
        }

    }

    function getKinveyUserAuthHeaders() {
        return {

            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),

        };
    }

    function createAd() {
        const kinveyAuthHeaders={
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };

        const kinveyUserUrl = `${kinveyBaseUrl}user/${kinveyAppKey}/${sessionStorage.getItem('userId')}`;

        $.ajax({
            method:'GET',
            url:kinveyUserUrl,
            headers:kinveyAuthHeaders,
            success:afterPublisherRequest,
            error:handleAjaxError
        });
        function afterPublisherRequest (publisher) {

            let title=$('#formCreateAd input[name=title]').val();
            if(title.length===0){
                showError('Title cannot be empty!')
                return;
            }
            let description=$('#formCreateAd textarea').val();
            let date=$('#formCreateAd input[name=datePublished]').val();
            let price=Number($('#formCreateAd input[name=price]').val());
            let image=$('#formCreateAd input[name=image]').val();
            let views=Number(0);


            let adData={
                    title:title,
                    publisher:publisher.username,
                    description:description,
                    image:image,
                    date:date,
                    price:Number(price),
                    views:views
            };



            $.ajax({
                method: "POST",
                url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/ads",
                headers: getKinveyUserAuthHeaders(),
                data: adData,
                success: createAdSuccess,
                error: handleAjaxError


            });


        }
        function createAdSuccess(data) {
            $('#viewCreateAd').find('form').trigger('reset');
            showInfo('Ads created.');
            listAd();
        }

    } //TODO Fix Price to Number
    function readAd(ad) {
        $('#ad-info').empty();
        showView('viewSingleAd');
        $.ajax({
            method:'GET',
            url:kinveyBaseUrl + 'appdata/' + kinveyAppKey + '/ads/' + ad._id,
            headers:getKinveyUserAuthHeaders(),
            success:readAdSuccess,
            error:handleAjaxError
        });
        function readAdSuccess(ad) {
            let counterInc=`${ad.views}`;
            counterInc++;
            let imageSource=`${ad.image}`;

            let divView=$(`<div id="ad-info">
            <p id="title">Title: ${ad.title}</p>
            <p id="publisher">Publisher: ${ad.publisher}</p>
          <p id="description">Description: ${ad.description}</p>
             <p id="price">Price: ${ad.price}</p>
             <p id="date">Date of Publishing: ${ad.date}</p>
             </div>`);
            let imageDiv=$('<div id="imageBox">');
            let image=$('<img id="adImage">');
            image.attr('src',imageSource);
            imageDiv.append(image);
            let viewCounter=$('<p id="counter">').text('Views: ');
            let counter=counterInc;
            viewCounter.append(counter);
            $('#ad-info').append(divView);
            $('#ad-info').append(viewCounter);
            $('#ad-info').append(imageDiv);



        }

    }

    function deleteAd(ad) {
        $.ajax({
            method:'DELETE',
            url:kinveyAdUrl=kinveyBaseUrl+ 'appdata/' + kinveyAppKey + '/ads/' + ad._id,
            headers:getKinveyUserAuthHeaders(),
            success:deleteAdSuccess,
            error:handleAjaxError
        });
        function deleteAdSuccess(response) {
            listAd();
            showInfo('Ad deleted.')
        }
    }
    function loadAdForEdit(ad) {
        $.ajax({
            method:'GET',
            url:kinveyAdUrl=kinveyBaseUrl+ 'appdata/' + kinveyAppKey + '/ads/' + ad._id,
            headers:getKinveyUserAuthHeaders(),
            success:loadAdForEditSuccess,
            error:handleAjaxError
        });
        function loadAdForEditSuccess(ad) {

            $('#formEditAd input[name=id]').val(ad._id);
            $('#formEditAd input[name=publisher]').val(ad.publisher);
            $('#formEditAd input[name=title]').val(ad.title);
            $('#formEditAd textarea').val(ad.description);
            $('#formEditAd input[name=datePublished]').val(ad.date);
            $('#formEditAd input[name=price]').val(ad.price);
            $('#formEditAd input[name=image]').val(ad.image);
            showView('viewEditAd')
        }
    }
    function editAd() {
        let title=$('#formEditAd input[name=title]').val();
        if(title.length===0){
            showError('Title cannot be empty!')
            return;
        }
        let description=$('#formEditAd textarea').val();
        let date=$('#formEditAd input[name=datePublished]').val();
        let price=Number($('#formEditAd input[name=price]').val());
        let image= $('#formEditAd input[name=image]').val();
        publisher=sessionStorage.getItem('username');
    let adData={
        title:title,
        publisher:publisher,
        description:description,
        image:image,
        date:date,
        price:Number(price)
    };
        $.ajax({
            method: "PUT",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/ads/" + $('#formEditAd input[name=id]').val(),
            headers: getKinveyUserAuthHeaders(),


            data: adData,


            success: editAdSuccess,


            error: handleAjaxError
    });
        function editAdSuccess(response) {
            listAd();
            showInfo('Ad edited.');


        }

}
}