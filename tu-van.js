// document.addEventListener("DOMContentLoaded", () => {
//     const messagesContainer = document.getElementById("messages");
//     const userInput = document.getElementById("user-input");
//     const sendButton = document.getElementById("send-button");
//     const fileUploadButton = document.getElementById("file-upload-button");
//     const fileUploadInput = document.getElementById("file-upload");

//     let pendingFile = null;

//     fileUploadButton.addEventListener("click", () => {
//         fileUploadInput.click();
//     });

//     fileUploadInput.addEventListener("change", (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             pendingFile = file;
//             const reader = new FileReader();
//             reader.onload = function (e) {
//                 const preview = document.createElement("img");
//                 preview.src = e.target.result;
//                 preview.style.maxWidth = "100px";
//                 document.getElementById("pending-file-preview").innerHTML = "";
//                 document.getElementById("pending-file-preview").appendChild(preview);
//             }
//             reader.readAsDataURL(file);
//         }
//     });

//     sendButton.addEventListener("click", async () => {
//         const message = userInput.value.trim();
//         if (!message && !pendingFile) return;

//         if (message) {
//             addMessageToUI("user", message);
//         }

//         userInput.value = "";
//         document.getElementById("pending-file-preview").innerHTML = "";

//         if (pendingFile) {
//             await processPendingFile();
//             pendingFile = null;
//         } else if (message) {
//         
//             try {
//                 const response = await fetch("http://127.0.0.1:5000/chat", {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json"
//                     },
//                     body: JSON.stringify({ message: message })
//                 });
//                 const data = await response.json();
//                 if (data.response) {
//                     addMessageToUI("ai", data.response);
//                 } else {
//                     addMessageToUI("ai", "Lỗi server: " + (data.error || "Không xác định"));
//                 }
//             } catch (err) {
//                 addMessageToUI("ai", "Lỗi khi gọi API backend: " + err.message);
//             }
//         }
//     });

//     async function processPendingFile() {
//         const file = pendingFile;
//         if (!file) return;

//         const formData = new FormData();
//         formData.append("image", file);

//         const reader = new FileReader();
//         reader.onload = function (e) {
//             const imgHtml = `<img src="${e.target.result}" style="max-width:100%;"/>`;
//             addMessageToUI("user", imgHtml);
//         };
//         reader.readAsDataURL(file);

//         try {
//             const response = await fetch("http://127.0.0.1:5000/analyze", {
//                 method: "POST",
//                 body: formData
//             });
//             const data = await response.json();

//             if (data.result) {
//                 addMessageToUI("ai", data.result);
//             } else {
//                 addMessageToUI("ai", "Lỗi server: " + (data.error || "Không xác định"));
//             }
//         } catch (err) {
//             addMessageToUI("ai", "Lỗi khi gọi API backend: " + err.message);
//         }
//     }

//     function addMessageToUI(sender, content) {
//         const messageDiv = document.createElement("div");
//         messageDiv.className = `message ${sender}`;

//         const messageContent = document.createElement("div");
//         messageContent.className = "message-content";

//         if (content.startsWith("<img")) {
//             messageContent.innerHTML = content;
//         } else {
//             messageContent.textContent = content;
//         }

//         messageDiv.appendChild(messageContent);
//         messagesContainer.appendChild(messageDiv);
//         messagesContainer.scrollTop = messagesContainer.scrollHeight;
//     }

//     
//     document.getElementById("new-chat").addEventListener("click", () => {
//         messagesContainer.innerHTML = "";
//         document.getElementById("current-chat-title").innerText = "Đoạn hội thoại mới";
//     });

//   
//     document.querySelectorAll(".suggestion-chip").forEach(button => {
//         button.addEventListener("click", (e) => {
//             const suggestion = e.target.innerText;
//             userInput.value = suggestion;
//             userInput.focus();
//         });
//     });

//    
//     document.getElementById("clear-history").addEventListener("click", () => {
//         messagesContainer.innerHTML = "";
//     });

//    
//     document.getElementById("toggle-theme").addEventListener("click", () => {
//         document.body.classList.toggle("dark-mode");
//     });
// });
document.addEventListener("DOMContentLoaded", () => {
    const messagesContainer = document.getElementById("messages");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const fileUploadButton = document.getElementById("file-upload-button");
    const fileUploadInput = document.getElementById("file-upload");
    const chatHistory = document.getElementById("chat-history");

    let pendingFile = null;
    let conversations = {};
    let currentConversationId = null;
    let historyItems = {}; 

    function generateId() {
        return Date.now().toString();
    }

    function startNewConversation() {
        currentConversationId = generateId();
        conversations[currentConversationId] = [];

        const historyItem = document.createElement("div");
        historyItem.className = "history-item cursor-pointer p-2 hover:bg-blue-100 rounded";
        historyItem.innerText = "Đoạn hội thoại mới";
        historyItem.dataset.id = currentConversationId;

        historyItem.addEventListener("click", () => {
            loadConversation(historyItem.dataset.id);
        });

        chatHistory.prepend(historyItem);
        historyItems[currentConversationId] = historyItem;

        messagesContainer.innerHTML = "";
        document.getElementById("current-chat-title").innerText = historyItem.innerText;
        document.getElementById("pending-file-preview").innerHTML = "";
        userInput.value = "";
        userInput.focus();
    }

    function loadConversation(id) {
        currentConversationId = id;
        messagesContainer.innerHTML = "";
        const history = conversations[id] || [];
        history.forEach(msg => {
            addMessageToUI(msg.sender, msg.content, false);
        });
        document.getElementById("current-chat-title").innerText = historyItems[id].innerText;
    }

    function addMessageToUI(sender, content, save = true) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}`;

        const messageContent = document.createElement("div");
        messageContent.className = "message-content";

        if (content.startsWith("<img")) {
            messageContent.innerHTML = content;
        } else {
            messageContent.textContent = content;
        }

        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (save && currentConversationId) {
            conversations[currentConversationId].push({ sender, content });
            if (sender === "user" && conversations[currentConversationId].length === 1) {
                historyItems[currentConversationId].innerText = content;
                document.getElementById("current-chat-title").innerText = content;
            }
        }
    }

    fileUploadButton.addEventListener("click", () => fileUploadInput.click());

    fileUploadInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            pendingFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement("img");
                preview.src = e.target.result;
                preview.style.maxWidth = "100px";
                document.getElementById("pending-file-preview").innerHTML = "";
                document.getElementById("pending-file-preview").appendChild(preview);
            };
            reader.readAsDataURL(file);
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = userInput.value.trim();
        if (!message && !pendingFile) return;

        if (!currentConversationId) startNewConversation();

        if (message) addMessageToUI("user", message);
        userInput.value = "";
        document.getElementById("pending-file-preview").innerHTML = "";

        if (pendingFile) {
            await processPendingFile();
            pendingFile = null;
        } else if (message) {
            try {
                const response = await fetch("http://127.0.0.1:5000/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });
                const data = await response.json();
                addMessageToUI("ai", data.response || ("Lỗi server: " + (data.error || "Không xác định")));
            } catch (err) {
                addMessageToUI("ai", "Lỗi khi gọi API backend: " + err.message);
            }
        }
    });

    async function processPendingFile() {
        const file = pendingFile;
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        const reader = new FileReader();
        reader.onload = (e) => addMessageToUI("user", `<img src='${e.target.result}' style='max-width:100%;'/>`);
        reader.readAsDataURL(file);

        try {
            const response = await fetch("http://127.0.0.1:5000/analyze", {
                method: "POST",
                body: formData
            });
            const data = await response.json();
            addMessageToUI("ai", data.result || ("Lỗi server: " + (data.error || "Không xác định")));
        } catch (err) {
            addMessageToUI("ai", "Lỗi khi gọi API backend: " + err.message);
        }
    }

    document.getElementById("new-chat").addEventListener("click", startNewConversation);

    document.querySelectorAll(".suggestion-chip").forEach(button => {
        button.addEventListener("click", (e) => {
            const suggestion = e.target.innerText;
            userInput.value = suggestion;
            userInput.focus();
        });
    });

    document.getElementById("clear-history").addEventListener("click", () => {
        messagesContainer.innerHTML = "";
        chatHistory.innerHTML = "";
        conversations = {};
        historyItems = {};
        currentConversationId = null;
    });

    document.getElementById("toggle-theme").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
});