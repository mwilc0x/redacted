import { fileIsAnImage, signS3 } from './Misc';

// Form Service
// Currently andles form logistics 
// (form setup/destroy, WebSocket communication, Image uploads)
export function FormService() {
    let formWS = null;

    // this calls s3 to upload the file with the signed request
    function uploadFile(file, signedRequest, url){
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signedRequest);
            xhr.onreadystatechange = () => {
                if(xhr.readyState === 4){
                    if(xhr.status === 200) {
                        resolve();
                    }
                    else{
                        reject();
                    }
                }
            };
            xhr.send(file);
        });
    }

    // this will populate the image preview dialog
    // after user has selected a file to upload
    function previewFile(cb) {
        var preview = document.getElementById('file-preview');
        var file = document.getElementById('file').files[0];
        var reader = new FileReader();

        if (!file) {
            console.log('no file selected');
            return;
        }

        if (file && fileIsAnImage(file.name)) {
            reader.readAsDataURL(file);

            function onLoad() {
                let content = reader.result;

                // load image into DOM
                preview.src = content;

                content = content.replace(/^(.+,)/, '');

                if (typeof cb === 'function') {
                    cb(file, content);
                }

                reader.removeEventListener('load', onLoad, false);
            }

            const listener = reader.addEventListener('load', onLoad, false);
        }
    }

    // when form mounts, boot up the web socket
    function formMount(state) {
        formWS = new WebSocket(`ws://${location.host}`);
        formWS.onerror = () => console.log('WebSocket error');
        // formWS.onopen = () => {
        //     console.log('WebSocket connection established');

        //     // check the route, are we on edit?
        //     if (state.route === 'edit-post') {
        //         formWS.send(JSON.stringify({ content: document.getElementById('content').value }));
        //     }
        // };
        formWS.onclose = () => console.log('WebSocket connection closed');

        formWS.onmessage = (msg) => {
            document.getElementById('post-preview').innerHTML = msg.data;
        }
    }

    // when form unmounts, destroy the web socket
    function formUnmount() {
        formWS.close();
        formWS = null;
    }

    // listen for when the textarea has been updated
    function changeEventHandler(event) {
        formWS.send(JSON.stringify({ content: event.target.value }));
    }

    // handle uploading of an image into the form content
    function handleImageSelection() {
        var file = document.getElementById('uploadImage').files[0];
        var reader = new FileReader();

        if (!file) {
            console.log('no file selected');
            return;
        }

        if (file && fileIsAnImage(file.name)) {
            reader.readAsDataURL(file);

            // get signature for upload to s3
            signS3(file).then(res => {
                uploadFile(file, res.signedRequest, res.url).then(function() {
                    const content = document.getElementById('content').value;
                    const newContent = (content !== '')
                        ? `${content}\n![${file.name}](${res.url})`
                        : `![${file.name}](${res.url})`;

                    document.getElementById('content').value = newContent;
                    formWS.send(JSON.stringify({ content: document.getElementById('content').value }));
                });
            });
        }
    }

    // handle the submission of the form
    function submit({ state, token, media }, event) {
        return new Promise((resolve, reject) => {
            // prevent the default browser form behavior, we'll handle it
            event.preventDefault();

            var myHeaders = new Headers();
            myHeaders.append('Content-Type', 'application/json');

            let route = '';
            let data = {};

            if (state.route === 'new-post') {
                route = 'save-post';
                data = {
                    deets: {
                        'title': document.getElementById('title').value,
                        'content': document.getElementById('content').value
                    },
                    token,
                    media,
                    user: {
                        login: state.user.login,
                        name: state.user.name
                    }
                };
            } else {
                route = 'update-post';
                const _id = document.getElementById('post-form').attributes['data-id'].nodeValue;

                const post = state.posts.find(p => p._id === _id);

                data = {
                    _id: post._id,
                    deets: {
                        'title': document.getElementById('title').value,
                        'content': document.getElementById('content').value
                    },
                    timestamp: post.timestamp,
                    token,
                    media,
                    user: state.user.login
                };
            }

            fetch(route, {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(data)
            })
            .then(res => {
                if (res && res.status === 200) {
                    // reset UI state
                    document.getElementById('submit-btn').classList.remove('purple');
                    document.getElementById('submit-btn').classList.add('green');

                    setTimeout(function() {
                        resolve();
                    }, 2500);
                } else {
                    reject('SAVE FAILURE');
                }
            });
        });
    }

    // delete a post from the database
    function deletePost({ store, getPosts, router }) {
        const state = store.getState();

        // prevent the default browser form behavior, we'll handle it
        event.preventDefault();

        var myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');

        const _id = document.getElementById('post-form').attributes['data-id'].nodeValue;
        const post = state.posts.find(p => p._id === _id);

        const data = {
            timestamp: post.timestamp
        };

        fetch('delete-post', {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(res => {
            if (res) {
                // fetch new list
                getPosts(store);

                // reset UI state
                document.getElementById('delete-btn').classList.remove('orange');
                document.getElementById('delete-btn').classList.add('green');

                setTimeout(function() {
                    router.go('index');
                }, 2500);
            } else {
                console.log('DELETE FAILURE');
            }
        });
    }

    return {
        formMount,
        formUnmount,
        changeEventHandler,
        handleImageSelection,
        previewFile,
        deletePost,
        submit
    }
}