# Import necessary libraries
from PIL import Image
import pytesseract

# Load the image
img = Image.open('image.png')

# Slice the image into parts
width, height = 1152, 2048

# Set the dimensions for image slices
slices = []
box_height = 45
left_indent = 8
box_length = 1126
top_indents = [420, 667, 917, 1165, 1417, 1669]

# Slice the image into parts
for top_indent in top_indents:
    box = (left_indent, top_indent, left_indent+box_length, top_indent+box_height)
    slices.append(img.crop(box))

# Get the month and year section
month_year = (left_indent, 68, left_indent+1040, 68+107)
slices.append(img.crop(month_year))

# Get the starting date section
start_date = (left_indent, 300, left_indent+180, 300+111)
slices.append(img.crop(start_date))

# Extract text from each image slice, remove newline characters, and split into an array
slices_to_text = []
for slice in slices:
    text = pytesseract.image_to_string(slice)
    replaced_text = text.replace("\n", " ")
    slices_to_text.append(replaced_text.split())

# Print each slice of text
for text_slice in slices_to_text:
    print(text_slice)

