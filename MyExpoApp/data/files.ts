export type FileItem = {
  id: number;
  name: string;
  date: string;
  type: string;
  typeColor: string;
  number: string;
  createdAt: string;
  creator: string;
  url: string;
  content: string;
};

export const files: FileItem[] = [
  {
    id: 1,
    name: "note.md",
    date: "10/02/2025 10:20AM",
    type: "Note",
    typeColor: "green",
    number: "241",
    createdAt: "2025-10-02T17:32:05.295Z",
    creator: "dsanchez113@ucmerced.edu",
    url: "https://connectworkapp.com/file/241",
    content: "Hello! This is a note.",
  },
  {
    id: 2,
    name: "resume.pdf",
    date: "10/02/2025 10:22AM",
    type: "Doc",
    typeColor: "orange",
    number: "242",
    createdAt: "2025-10-02T17:34:12.123Z",
    creator: "dsanchez113@ucmerced.edu",
    url: "https://connectworkapp.com/file/242",
    content: "This is a resume document.",
  },
  {
    id: 3,
    name: "image.png",
    date: "10/02/2025 10:28AM",
    type: "Image",
    typeColor: "red",
    number: "243",
    createdAt: "2025-10-02T17:40:28.456Z",
    creator: "dsanchez113@ucmerced.edu",
    url: "https://connectworkapp.com/file/243",
    content: "This is an image file.",
  },
  {
    id: 4,
    name: "video.mp4",
    date: "10/02/2025 10:30AM",
    type: "Recording",
    typeColor: "blue",
    number: "244",
    createdAt: "2025-10-02T17:42:15.789Z",
    creator: "dsanchez113@ucmerced.edu",
    url: "https://connectworkapp.com/file/244",
    content: "This is a video recording.",
  },
  {
    id: 5,
    name: "audio.mp3",
    date: "10/02/2025 10:32AM",
    type: "Recording",
    typeColor: "blue",
    number: "245",
    createdAt: "2025-10-02T17:44:33.012Z",
    creator: "dsanchez113@ucmerced.edu",
    url: "https://connectworkapp.com/file/245",
    content: "This is an audio recording.",
  },
  {
    id: 6,
    name: "file.docx",
    date: "10/02/2025 10:34AM",
    type: "Doc",
    typeColor: "orange",
    number: "246",
    createdAt: "2025-10-02T17:46:47.345Z",
    creator: "dsanchez113@ucmerced.edu",
    url: "https://connectworkapp.com/file/246",
    content: "This is a Word document.",
  },
  {
    id: 7,
    name: "presentation.pptx",
    date: "10/02/2025 10:36AM",
    type: "Doc",
    typeColor: "orange",
    number: "247",
    createdAt: "2025-10-02T17:48:59.678Z",
    creator: "dsanchez113@ucmerced.edu",
    url: "https://connectworkapp.com/file/247",
    content: "This is a PowerPoint presentation.",
  },
  {
    id: 8,
    name: "spreadsheet.xlsx",
    date: "10/02/2025 10:38AM",
    type: "Doc",
    typeColor: "orange",
    number: "248",
    createdAt: "2025-10-02T17:51:11.901Z",
    creator: "dsanchez113@ucmerced.edu",
    url: "https://connectworkapp.com/file/248",
    content: "This is an Excel spreadsheet.",
  },
];
