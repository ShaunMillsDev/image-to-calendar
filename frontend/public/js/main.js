
// Get the input element for the image upload
const input = document.getElementById('imageUpload');
const resizeHandle = document.createElement('div');
const createImageButton = document.getElementById('create-image-button');

let box = document.querySelector('.box');
let editor = document.getElementById('editor');

// for moving box
let isDragging = false;
let startY = 0;
let boxTop = 0;

// for resizing box
let isResizing = false;
let startHeight = 0;
let boxHeight = 0;

resizeHandle.classList.add('resize-handle');
box.appendChild(resizeHandle);


// Button for adding the picture slices to calendar
document.getElementById('addToCalendar').addEventListener('click', async () => {
  const finalDays = document.getElementById('finalDays');
  const images = finalDays.getElementsByTagName('img');

  const base64Images = [];

  for (const img of images) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    base64Images.push(canvas.toDataURL().split(',')[1]);
  }

  try {
    const response = await fetch('/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ images: base64Images })
    });

    const data = await response.json();
    const authUrl = data.authUrl;

    document.body.classList.add('hide-elements');

    // Create a button for the user to click
    const button = document.createElement('button');
    button.textContent = 'Authorise App';
    button.classList.add('button');
    button.onclick = () => {
      window.location.href = authUrl;
      button.remove();
    };
    document.body.appendChild(button);

  } catch (error) {
    console.error('Error:', error);
  }
});

// For changing the image
input.addEventListener('change', () => {

  // Get the elements of the page
  const editor = document.getElementById('editor');
  const imageContainer = document.querySelector('.image-container');
  const box = document.querySelector('.box');
  const createImageButton = document.querySelector('#create-image-button')

  // Get the first file from the input element
  const file = input.files[0];

  // Create a new FileReader object
  const reader = new FileReader();

  // Define the onload function for the FileReader object
  reader.onload = () => {

    // Create a new image element
    let img = document.createElement('img');

    // Set the src attribute of the image element to the data URL generated by the FileReader
    img.src = reader.result;

    // Remove any previously uploaded images from the image container
    imageContainer.innerHTML = '';

    // Append the image element to the image container
    imageContainer.appendChild(img);

    img.onload = () => {
      editor.style.visibility = "visible";
      box.style.visibility = "visible";
      createImageButton.style.visibility = "visible";

      // Calculate the maximum width for the image, considering the available screen size
      const maxWidth = window.innerWidth * 0.8;

      // Calculate the scaling factor based on the maximum width
      const scaleFactor = maxWidth / img.width;

      // Scale the image width and height
      const scaledWidth = img.width * scaleFactor;
      const scaledHeight = img.height * scaleFactor;

      // Set the width and height attributes of the img element to the new scaled dimensions
      img.width = scaledWidth;
      img.height = scaledHeight;

      // Set the width and height of the image container and editor to match the uploaded image size
      editor.style.width = `${scaledWidth + 9}px`;
      editor.style.height = `${scaledHeight + 10}px`;

      imageContainer.style.width = `${scaledWidth - 1}px`;
      imageContainer.style.height = `${scaledHeight}px`;

      box.style.width = `${scaledWidth - 1}px`;
      box.style.top = img.top;
      box.style.left = img.left;
    }
  };

  // Read the selected file as a data URL
  reader.readAsDataURL(file);
});

// For pressing creating image button
createImageButton.addEventListener('click', () => {
  const addToCalendar = document.querySelector('#addToCalendar')

  // Get the box element and its dimensions
  const boxWidth = box.clientWidth;
  const boxHeight = box.clientHeight;

  // Create a new canvas element with the same dimensions as the box
  const canvas = document.createElement('canvas');

  // Get the image inside the imageContainer
  const originalImage = document.querySelector('.image-container img');

  // Create a new image with the same source as the image inside the imageContainer
  const sourceImage = new Image();
  sourceImage.src = originalImage.src;

  sourceImage.onload = () => {
    // Calculate the scaling factors for the original image
    const scaleX = originalImage.naturalWidth / originalImage.clientWidth;
    const scaleY = originalImage.naturalHeight / originalImage.clientHeight;

    // Calculate the dimensions of the unscaled cropped image
    const unscaledWidth = boxWidth * scaleX;
    const unscaledHeight = boxHeight * scaleY;

    // Set the canvas dimensions to match the unscaled cropped image dimensions
    canvas.width = unscaledWidth;
    canvas.height = unscaledHeight;

    // Copy the contents of the box onto the canvas
    const ctx = canvas.getContext('2d');

    const boxPosition = box.getBoundingClientRect();
    const imageContainerPosition = originalImage.getBoundingClientRect();

    const xOffset = boxPosition.x - imageContainerPosition.x + 5;
    const yOffset = boxPosition.y - imageContainerPosition.y + 5;

    ctx.drawImage(sourceImage, xOffset * scaleX, yOffset * scaleY, unscaledWidth, unscaledHeight, 0, 0, unscaledWidth, unscaledHeight);

    // Convert the canvas to a data URL representing the image
    const dataURL = canvas.toDataURL();

    // Create a new image element with the data URL as the source
    const img = document.createElement('img');
    img.src = dataURL;

    // Add the new image element to the page
    const finalDays = document.getElementById('finalDays');
    finalDays.appendChild(img);

    addToCalendar.style.visibility = "visible";

  };
});

// For dragging
box.addEventListener('mousedown', startDragging);
box.addEventListener('touchstart', startDragging);

// For resizing
resizeHandle.addEventListener('mousedown', startResizing);
resizeHandle.addEventListener('touchstart', startResizing);

// For moving and resizing
document.addEventListener('mousemove', updateBoxPosition);
document.addEventListener('touchmove', updateBoxPosition);

// For stopping moving and resizing
document.addEventListener('mouseup', stopActions);
document.addEventListener('touchend', stopActions);

function startDragging(event) {
  if (!isResizing) {
    isDragging = true;
    startY = event.clientY || event.touches[0].clientY;
    boxTop = parseInt(window.getComputedStyle(box).top, 10);
  }
}

function startResizing(event) {
  isResizing = true;
  startHeight = event.clientY || event.touches[0].clientY;
  boxHeight = box.clientHeight;
}

function updateBoxPosition(event) {
  event.preventDefault(); // Prevent default touch actions like scrolling

  const clientY = event.clientY || (event.touches && event.touches.length > 0 && event.touches[0].clientY);

  if (isDragging) {
    // Calculate the new top position of the box
    const newTop = boxTop + (clientY - startY);

    // Get the height of the editor and the box
    const editorHeight = editor.clientHeight - 10;
    const boxHeight = box.clientHeight;

    // Constrain the box to stay within the bounds of the editor
    const minTop = 0;
    const maxTop = editorHeight - boxHeight;
    const constrainedTop = Math.max(minTop, Math.min(maxTop, newTop));

    // Update the top position of the box
    box.style.top = `${constrainedTop}px`;
  }

  if (isResizing) {
    // Calculate the new height of the box
    const newHeight = boxHeight + (clientY - startHeight);

    // Get the height of the editor
    const editorHeight = editor.clientHeight - 10;

    // Constrain the box to stay within the bounds of the editor
    const minHeight = 0;
    const maxHeight = editorHeight - parseInt(window.getComputedStyle(box).top, 10);
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

    // Update the height of the box
    box.style.height = `${constrainedHeight}px`;
  }
}

function stopActions() {
  if (isDragging) isDragging = false;
  if (isResizing) isResizing = false;
}

document.addEventListener('touchmove', (event) => {
  if (isDragging || isResizing) {
    event.preventDefault();
  }
}, { passive: false });
