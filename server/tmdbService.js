import axios from 'axios';
import Movie from './models/Movie.js';
import { isDbConnected } from './db.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Simple in-memory cache to prevent unbounded or redundant API calls
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function isApiKeyConfigured() {
  const key = process.env.TMDB_API_KEY;
  return Boolean(key && key.trim().length > 5 && !key.includes('YOUR_'));
}

function getAxiosConfig() {
  const key = (process.env.TMDB_API_KEY || '').trim();
  const headers = { 'Accept': 'application/json' };
  
  // Support both Bearer tokens and standard v3 API query keys
  if (key.length > 50) {
    headers['Authorization'] = `Bearer ${key}`;
    return { headers, params: {} };
  } else {
    return { headers, params: { api_key: key } };
  }
}

// Fallback curated dataset for instant out-of-the-box discovery if TMDB key is not yet set
const FALLBACK_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' }
];

export const FALLBACK_MOVIES = [
  {
    id: 157336,
    title: "Interstellar",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    release_date: "2014-11-05",
    year: 2014,
    runtime: 169,
    vote_average: 8.4,
    vote_count: 36000,
    poster_path: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/rAiYTnrLEhkV69pX915Rk0qYp6L.jpg",
    genres: ["Science Fiction", "Drama", "Adventure"],
    genre_ids: [878, 18, 12],
    director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video", "Apple TV"],
      US: ["Paramount+", "Prime Video"]
    }
  },
  {
    id: 27205,
    title: "Inception",
    overview: "Cobb, a skilled thief who steals corporate secrets through use of dream-sharing technology, is given the inverse task of planting an idea into the mind of a CEO.",
    release_date: "2010-07-15",
    year: 2010,
    runtime: 148,
    vote_average: 8.4,
    vote_count: 37000,
    poster_path: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    genres: ["Action", "Science Fiction", "Adventure"],
    genre_ids: [28, 878, 12],
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    streaming_providers: {
      IN: ["Netflix", "JioCinema", "Prime Video"],
      US: ["Max", "Hulu"]
    }
  },
  {
    id: 872585,
    title: "Oppenheimer",
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    release_date: "2023-07-19",
    year: 2023,
    runtime: 180,
    vote_average: 8.1,
    vote_count: 9200,
    poster_path: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/fm6K9vYI09rlVIyH8kL949qB8vP.jpg",
    genres: ["Drama", "History"],
    genre_ids: [18, 36],
    director: "Christopher Nolan",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
    streaming_providers: {
      IN: ["JioCinema", "Prime Video"],
      US: ["Prime Video"]
    }
  },
  {
    id: 693134,
    title: "Dune: Part Two",
    overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
    release_date: "2024-02-27",
    year: 2024,
    runtime: 166,
    vote_average: 8.2,
    vote_count: 6100,
    poster_path: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
    genres: ["Science Fiction", "Adventure"],
    genre_ids: [878, 12],
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
    streaming_providers: {
      IN: ["JioCinema", "Prime Video", "Apple TV"],
      US: ["Max"]
    }
  },
  {
    id: 438631,
    title: "Dune",
    overview: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe.",
    release_date: "2021-09-15",
    year: 2021,
    runtime: 155,
    vote_average: 7.8,
    vote_count: 11500,
    poster_path: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/eeijXm355AGZeDg6yaDGkeo3RKV.jpg",
    genres: ["Science Fiction", "Adventure"],
    genre_ids: [878, 12],
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac", "Josh Brolin"],
    streaming_providers: {
      IN: ["Netflix", "JioCinema", "Prime Video"],
      US: ["Max"]
    }
  },
  {
    id: 496243,
    title: "Parasite",
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    release_date: "2019-05-30",
    year: 2019,
    runtime: 132,
    vote_average: 8.5,
    vote_count: 18000,
    poster_path: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
    genres: ["Comedy", "Thriller", "Drama"],
    genre_ids: [35, 53, 18],
    director: "Bong Joon-ho",
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik"],
    streaming_providers: {
      IN: ["SonyLIV", "Prime Video"],
      US: ["Max", "Hulu"]
    }
  },
  {
    id: 419430,
    title: "Get Out",
    overview: "Chris and his girlfriend Rose go upstate to visit her parents for a weekend getaway. At first, Chris reads the family's overly accommodating behavior as nervous attempts to deal with their daughter's interracial relationship, but as the weekend progresses, a series of increasingly disturbing discoveries leads him to a truth that he never could have imagined.",
    release_date: "2017-02-24",
    year: 2017,
    runtime: 104,
    vote_average: 7.6,
    vote_count: 17000,
    poster_path: "https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/m5zkv6lE6c6gGv8o2LzN7C7wY8w.jpg",
    genres: ["Horror", "Mystery", "Thriller"],
    genre_ids: [27, 9648, 53],
    director: "Jordan Peele",
    cast: ["Daniel Kaluuya", "Allison Williams", "Bradley Whitford", "Catherine Keener"],
    streaming_providers: {
      IN: ["JioCinema", "Prime Video"],
      US: ["Peacock"]
    }
  },
  {
    id: 429617,
    title: "Spider-Man: Far From Home",
    overview: "Peter Parker and his friends go on a summer trip to Europe. However, they will hardly be able to rest - Peter will have to agree to help Nick Fury uncover the mystery of creatures that cause natural disasters and destruction throughout the continent.",
    release_date: "2019-06-28",
    year: 2019,
    runtime: 129,
    vote_average: 7.4,
    vote_count: 15400,
    poster_path: "https://image.tmdb.org/t/p/w500/4q2NNXdrwmDYscMi0RwR4mgR0W2.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/tH1B9y1yV2g6qA16qKx8gT2wQ9A.jpg",
    genres: ["Action", "Adventure", "Science Fiction"],
    genre_ids: [28, 12, 878],
    director: "Jon Watts",
    cast: ["Tom Holland", "Samuel L. Jackson", "Jake Gyllenhaal", "Zendaya"],
    streaming_providers: {
      IN: ["Netflix", "SonyLIV", "Prime Video"],
      US: ["Disney+", "Starz"]
    }
  },
  {
    id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    overview: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society.",
    release_date: "2023-05-31",
    year: 2023,
    runtime: 140,
    vote_average: 8.4,
    vote_count: 7000,
    poster_path: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    genres: ["Animation", "Action", "Adventure", "Science Fiction"],
    genre_ids: [16, 28, 12, 878],
    director: "Joaquim Dos Santos",
    cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Jake Johnson"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video"],
      US: ["Netflix"]
    }
  },
  {
    id: 346364,
    title: "It",
    overview: "In a small town in Maine, seven children come face to face with life problems, bullies and a monster that takes the shape of a clown called Pennywise.",
    release_date: "2017-09-06",
    year: 2017,
    runtime: 135,
    vote_average: 7.2,
    vote_count: 18500,
    poster_path: "https://image.tmdb.org/t/p/w500/9E2STTruthda9KMTCQkLFiKVNdp.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/tcheoA2nPATCm2vvXw2Ij4586Ym.jpg",
    genres: ["Horror"],
    genre_ids: [27],
    director: "Andy Muschietti",
    cast: ["Bill Skarsgård", "Jaeden Martell", "Finn Wolfhard", "Sophia Lillis"],
    streaming_providers: {
      IN: ["JioCinema", "Prime Video"],
      US: ["Max"]
    }
  },
  {
    id: 530385,
    title: "Midsommar",
    overview: "Several friends travel to Sweden to study as anthropologists a summer festival that is held every ninety years in the remote hometown of one of them. What begins as a dream holiday in a place where the sun never sets, gradually turns into an increasingly bizarre and visibly harrowing nightmare.",
    release_date: "2019-07-03",
    year: 2019,
    runtime: 147,
    vote_average: 7.1,
    vote_count: 7000,
    poster_path: "https://image.tmdb.org/t/p/w500/7LEI8ulraZFrURQSUW3NUo9004u.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/g6Ha3xhb5MuYF12f6j9G9d5kPq8.jpg",
    genres: ["Horror", "Drama", "Mystery"],
    genre_ids: [27, 18, 9648],
    director: "Ari Aster",
    cast: ["Florence Pugh", "Jack Reynor", "William Jackson Harper", "Vilhelm Blomgren"],
    streaming_providers: {
      IN: ["Prime Video", "Lionsgate Play"],
      US: ["Max"]
    }
  },
  {
    id: 335984,
    title: "Blade Runner 2049",
    overview: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
    release_date: "2017-10-04",
    year: 2017,
    runtime: 164,
    vote_average: 7.6,
    vote_count: 13000,
    poster_path: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/ilRyAZwN3SKgRhB7Wj7f12vYwH5.jpg",
    genres: ["Science Fiction", "Drama"],
    genre_ids: [878, 18],
    director: "Denis Villeneuve",
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvia Hoeks"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video"],
      US: ["Hulu"]
    }
  },
  {
    id: 76600,
    title: "Avatar: The Way of Water",
    overview: "Set more than a decade after the events of the first film, learn the story of the Sully family, the trouble that follows them, the lengths they go to keep each other safe, the battles they fight to stay alive, and the tragedies they endure.",
    release_date: "2022-12-14",
    year: 2022,
    runtime: 192,
    vote_average: 7.6,
    vote_count: 11000,
    poster_path: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg",
    genres: ["Science Fiction", "Adventure", "Action"],
    genre_ids: [878, 12, 28],
    director: "James Cameron",
    cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Stephen Lang"],
    streaming_providers: {
      IN: ["Disney+ Hotstar"],
      US: ["Disney+", "Max"]
    }
  },
  {
    id: 374720,
    title: "Dunkirk",
    overview: "Miraculous evacuation of Allied soldiers from Belgium, Britain, Canada, and France, who were cut off and surrounded by the German army from the beaches and harbor of Dunkirk, France, between May 26 and June 04, 1940, during the Battle of France in World War II.",
    release_date: "2017-07-19",
    year: 2017,
    runtime: 106,
    vote_average: 7.5,
    vote_count: 16000,
    poster_path: "https://image.tmdb.org/t/p/w500/ebSnODDg9lbsMIaWg2uAbjn7TO5.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/fudEG1VUWuOqleXv6NwCIIiz4m9.jpg",
    genres: ["War", "Action", "Drama"],
    genre_ids: [10752, 28, 18],
    director: "Christopher Nolan",
    cast: ["Fionn Whitehead", "Tom Glynn-Carney", "Jack Lowden", "Harry Styles"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video"],
      US: ["Apple TV"]
    }
  },
  {
    id: 11324,
    title: "Shutter Island",
    overview: "World War II soldier turned U.S. Marshal Teddy Daniels investigates the disappearance of a patient from a hospital for the criminally insane, but his efforts are compromised by his troubling dreams and a mysterious hurricane.",
    release_date: "2010-02-14",
    year: 2010,
    runtime: 138,
    vote_average: 8.2,
    vote_count: 23000,
    poster_path: "https://image.tmdb.org/t/p/w500/4GDy0PHYX3VRXUtwK5ysagvk2Te.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/c4T4A2G16wN5Zz3KqB5k7A7N3oW.jpg",
    genres: ["Drama", "Thriller", "Mystery"],
    genre_ids: [18, 53, 9648],
    director: "Martin Scorsese",
    cast: ["Leonardo DiCaprio", "Mark Ruffalo", "Ben Kingsley", "Max von Sydow"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video"],
      US: ["Paramount+"]
    }
  },
  {
    id: 497,
    title: "The Green Mile",
    overview: "A supernatural tale for the ages unfolds within a Death Row block in a Southern prison, where a gentle giant possess an incredible power to heal people's ailments.",
    release_date: "1999-12-10",
    year: 1999,
    runtime: 189,
    vote_average: 8.5,
    vote_count: 17000,
    poster_path: "https://image.tmdb.org/t/p/w500/8VG8fDNiy5087vBh59PzTC4IRZ7.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/l6hQWH92m4Fei018IR5Kt6Ur795.jpg",
    genres: ["Fantasy", "Drama", "Crime"],
    genre_ids: [14, 18, 80],
    director: "Frank Darabont",
    cast: ["Tom Hanks", "David Morse", "Bonnie Hunt", "Michael Clarke Duncan"],
    streaming_providers: {
      IN: ["Prime Video"],
      US: ["Apple TV"]
    }
  },
  {
    id: 77338,
    title: "The Intouchables",
    overview: "A true story of two men who should never have met - a quadriplegic aristocrat who was injured in a paragliding accident and a young man from the projects who was hired to be his caretaker.",
    release_date: "2011-11-02",
    year: 2011,
    runtime: 112,
    vote_average: 8.3,
    vote_count: 17000,
    poster_path: "https://image.tmdb.org/t/p/w500/1hRoyzDtpgMU7Dz4JF22RANzQ57.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/4u4L6H1qZqZ8k1GqG7N8a7N2a1.jpg",
    genres: ["Drama", "Comedy"],
    genre_ids: [18, 35],
    director: "Olivier Nakache",
    cast: ["François Cluzet", "Omar Sy", "Anne Le Ny", "Audrey Fleurot"],
    streaming_providers: {
      IN: ["Prime Video"],
      US: ["Prime Video"]
    }
  },
  {
    id: 6479,
    title: "I Am Legend",
    overview: "Robert Neville is a scientist who was unable to stop the spread of the terrible virus that was incurable and man-made. Immune, Neville is now the last human survivor in what is left of New York City and perhaps the world.",
    release_date: "2007-12-12",
    year: 2007,
    runtime: 101,
    vote_average: 7.2,
    vote_count: 15600,
    poster_path: "https://image.tmdb.org/t/p/w500/iPDkaSdKk2jRLXQI7v8J784YJ9F.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/2wP7wRzF17h1fG25Qo117M3pQ5o.jpg",
    genres: ["Drama", "Horror", "Science Fiction"],
    genre_ids: [18, 27, 878],
    director: "Francis Lawrence",
    cast: ["Will Smith", "Alice Braga", "Charlie Tahan", "Salli Richardson-Whitfield"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video"],
      US: ["Max"]
    }
  },
  {
    id: 10681,
    title: "WALL·E",
    overview: "In a distant future, a small waste-collecting robot inadvertently embarks on a space journey that will ultimately decide the fate of mankind.",
    release_date: "2008-06-22",
    year: 2008,
    runtime: 98,
    vote_average: 8.1,
    vote_count: 18000,
    poster_path: "https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/fK5ssFvtR04z9W4LiUr29ZwjkGQ.jpg",
    genres: ["Animation", "Family", "Science Fiction"],
    genre_ids: [16, 10751, 878],
    director: "Andrew Stanton",
    cast: ["Ben Burtt", "Elissa Knight", "Jeff Garlin", "Fred Willard"],
    streaming_providers: {
      IN: ["Disney+ Hotstar"],
      US: ["Disney+"]
    }
  },
  {
    id: 313369,
    title: "La La Land",
    overview: "Mia, an aspiring actress, serves lattes to movie stars in between auditions and Sebastian, a jazz musician, scrapes by playing cocktail party gigs in dingy bars, but after a chance encounter, both discover the magic of romantic ambition.",
    release_date: "2016-11-29",
    year: 2016,
    runtime: 128,
    vote_average: 7.9,
    vote_count: 16500,
    poster_path: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/qJeU79f42U7fC060o4U6yYF1kC0.jpg",
    genres: ["Comedy", "Drama", "Romance", "Music"],
    genre_ids: [35, 18, 10749, 10402],
    director: "Damien Chazelle",
    cast: ["Ryan Gosling", "Emma Stone", "John Legend", "J.K. Simmons"],
    streaming_providers: {
      IN: ["Prime Video", "Lionsgate Play"],
      US: ["Hulu"]
    }
  },
  {
    id: 244786,
    title: "Whiplash",
    overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
    release_date: "2014-10-10",
    year: 2014,
    runtime: 107,
    vote_average: 8.4,
    vote_count: 14700,
    poster_path: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/6bbZ6XNvxvgEi9iKj5X5tqN7H8n.jpg",
    genres: ["Drama", "Music"],
    genre_ids: [18, 10402],
    director: "Damien Chazelle",
    cast: ["Miles Teller", "J.K. Simmons", "Paul Reiser", "Melissa Benoist"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video"],
      US: ["Netflix"]
    }
  },
  {
    id: 37799,
    title: "The Social Network",
    overview: "On a fall night in 2003, Harvard undergrad and computer programming genius Mark Zuckerberg sits down at his computer and heatedly begins working on a new idea.",
    release_date: "2010-10-01",
    year: 2010,
    runtime: 120,
    vote_average: 7.8,
    vote_count: 13000,
    poster_path: "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTpTzbRHY31IR.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/a0HlW7kG7H3V1lZt4aWf4K9e2oZ.jpg",
    genres: ["Drama", "History"],
    genre_ids: [18, 36],
    director: "David Fincher",
    cast: ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake", "Armie Hammer"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video", "SonyLIV"],
      US: ["Max"]
    }
  },
  {
    id: 550,
    title: "Fight Club",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground clubs forming in every town, until an eccentric gets in the way.",
    release_date: "1999-10-15",
    year: 1999,
    runtime: 139,
    vote_average: 8.4,
    vote_count: 28500,
    poster_path: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    genres: ["Drama"],
    genre_ids: [18],
    director: "David Fincher",
    cast: ["Edward Norton", "Brad Pitt", "Helena Bonham Carter", "Meat Loaf"],
    streaming_providers: {
      IN: ["Prime Video", "Disney+ Hotstar"],
      US: ["Hulu"]
    }
  },
  {
    id: 577922,
    title: "Tenet",
    overview: "Armed with only one word - Tenet - and fighting for the survival of the entire world, the Protagonist journeys through a twilight world of international espionage on a mission that will unfold in something beyond real time.",
    release_date: "2020-08-22",
    year: 2020,
    runtime: 150,
    vote_average: 7.2,
    vote_count: 9400,
    poster_path: "https://image.tmdb.org/t/p/w500/k68nPLbIST6NP96JmTxmZijEvCA.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/wzJRB4MKi3yK138b0qfD8H1f8o0.jpg",
    genres: ["Action", "Science Fiction", "Thriller"],
    genre_ids: [28, 878, 53],
    director: "Christopher Nolan",
    cast: ["John David Washington", "Robert Pattinson", "Elizabeth Debicki", "Kenneth Branagh"],
    streaming_providers: {
      IN: ["Netflix", "Prime Video", "JioCinema"],
      US: ["Apple TV"]
    }
  },
  {
    id: 579974,
    title: "RRR",
    overview: "A fictional history of two legendary revolutionaries' journey away from home before they began fighting for their country in the 1920s.",
    release_date: "2022-03-24",
    year: 2022,
    runtime: 182,
    vote_average: 7.7,
    vote_count: 1700,
    poster_path: "https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0ye2Nw0Af.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/707thQ468k1pLz62B4fG0G4p2K.jpg",
    genres: ["Action", "Drama"],
    genre_ids: [28, 18],
    director: "S. S. Rajamouli",
    cast: ["N.T. Rama Rao Jr.", "Ram Charan", "Alia Bhatt", "Ajay Devgn"],
    streaming_providers: {
      IN: ["Netflix", "ZEE5", "Disney+ Hotstar"],
      US: ["Netflix"]
    }
  },
  {
    id: 399566,
    title: "Godzilla vs. Kong",
    overview: "In a time when monsters walk the Earth, humanity’s fight for its future sets Godzilla and Kong on a collision course that will see the two most powerful forces of nature on the planet collide in a spectacular battle for the ages.",
    release_date: "2021-03-24",
    year: 2021,
    runtime: 113,
    vote_average: 6.6,
    vote_count: 9700,
    poster_path: "https://image.tmdb.org/t/p/w500/pgqgaUx1cJb5oZQQ5v0t9R8xug2.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/inJjDhCjfhh3R3vvbmW4zD6vT4W.jpg",
    genres: ["Action", "Science Fiction"],
    genre_ids: [28, 878],
    director: "Adam Wingard",
    cast: ["Alexander Skarsgård", "Millie Bobby Brown", "Rebecca Hall", "Brian Tyree Henry"],
    streaming_providers: {
      IN: ["Prime Video", "JioCinema"],
      US: ["Max"]
    }
  },
  {
    id: 671,
    title: "Harry Potter and the Philosopher's Stone",
    overview: "Harry Potter has lived under the stairs at his aunt and uncle's house his whole life. But on his 11th birthday, he learns he's a powerful wizard with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry.",
    release_date: "2001-11-16",
    year: 2001,
    runtime: 152,
    vote_average: 7.9,
    vote_count: 26000,
    poster_path: "https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/5rrGVmRUJunNZTXJegWvfr6q5Nu.jpg",
    genres: ["Adventure", "Fantasy"],
    genre_ids: [12, 14],
    director: "Chris Columbus",
    cast: ["Daniel Radcliffe", "Rupert Grint", "Emma Watson", "Richard Harris"],
    streaming_providers: {
      IN: ["JioCinema", "Prime Video"],
      US: ["Max", "Peacock"]
    }
  },
  {
    id: 745,
    title: "The Sixth Sense",
    overview: "Following an unexpected tragedy, child psychologist Malcolm Crowe takes on the task of helping a young boy, Cole Sear, who claims he sees ghosts.",
    release_date: "1999-08-06",
    year: 1999,
    runtime: 107,
    vote_average: 8.0,
    vote_count: 11500,
    poster_path: "https://image.tmdb.org/t/p/w500/4AfSDjjCy6T5LAkox89VUmDXypS.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/9iRRfWz14pmuNkW8y93bU8nKj2U.jpg",
    genres: ["Mystery", "Thriller", "Drama"],
    genre_ids: [9648, 53, 18],
    director: "M. Night Shyamalan",
    cast: ["Bruce Willis", "Haley Joel Osment", "Toni Collette", "Olivia Williams"],
    streaming_providers: {
      IN: ["Disney+ Hotstar"],
      US: ["Disney+"]
    }
  },
  {
    id: 120,
    title: "The Lord of the Rings: The Fellowship of the Ring",
    overview: "Young hobbit Frodo Baggins, after inheriting a mysterious ring from his uncle Bilbo, must leave his home behind in order to begin an epic quest to the fires of Mount Doom to destroy it.",
    release_date: "2001-12-18",
    year: 2001,
    runtime: 178,
    vote_average: 8.4,
    vote_count: 24500,
    poster_path: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/x2RS3uTcsJJ9Ifj2mjyY0oK2aJ4.jpg",
    genres: ["Adventure", "Fantasy", "Action"],
    genre_ids: [12, 14, 28],
    director: "Peter Jackson",
    cast: ["Elijah Wood", "Ian McKellen", "Viggo Mortensen", "Sean Astin"],
    streaming_providers: {
      IN: ["Prime Video"],
      US: ["Max"]
    }
  },
  {
    id: 862,
    title: "Toy Story",
    overview: "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene. Afraid of losing his place in Andy's heart, Woody plots against Buzz.",
    release_date: "1995-10-30",
    year: 1995,
    runtime: 81,
    vote_average: 8.0,
    vote_count: 17800,
    poster_path: "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrFu1buKLO.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/lxD5ak7BOxMitIO1Ky5832u9Vyv.jpg",
    genres: ["Animation", "Adventure", "Family", "Comedy"],
    genre_ids: [16, 12, 10751, 35],
    director: "John Lasseter",
    cast: ["Tom Hanks", "Tim Allen", "Don Rickles", "Jim Varney"],
    streaming_providers: {
      IN: ["Disney+ Hotstar"],
      US: ["Disney+"]
    }
  }
];

// Helper: Normalize movie object
function normalizeMovie(movie, region = 'IN') {
  let releaseDate = movie.release_date || '';
  let year = null;
  if (releaseDate && releaseDate.length >= 4) {
    const parsed = parseInt(releaseDate.substring(0, 4), 10);
    if (!isNaN(parsed)) year = parsed;
  }

  // Genres
  let genres = [];
  if (Array.isArray(movie.genres)) {
    genres = movie.genres.map(g => (typeof g === 'string' ? g : g.name)).filter(Boolean);
  }

  // Crew & Cast
  let director = movie.director || null;
  let cast = Array.isArray(movie.cast) ? movie.cast : [];
  
  if (movie.credits) {
    if (movie.credits.crew) {
      const dirObj = movie.credits.crew.find(c => c.job === 'Director');
      if (dirObj) director = dirObj.name;
    }
    if (movie.credits.cast) {
      cast = movie.credits.cast.slice(0, 8).map(c => c.name);
    }
  }

  // Watch providers
  let streamingProviders = [];
  if (movie.streaming_providers) {
    if (Array.isArray(movie.streaming_providers)) {
      streamingProviders = movie.streaming_providers;
    } else if (movie.streaming_providers[region]) {
      streamingProviders = movie.streaming_providers[region];
    } else if (movie.streaming_providers['IN']) {
      streamingProviders = movie.streaming_providers['IN'];
    } else {
      const firstAvailable = Object.values(movie.streaming_providers)[0];
      if (Array.isArray(firstAvailable)) streamingProviders = firstAvailable;
    }
  } else if (movie['watch/providers']?.results) {
    const provResults = movie['watch/providers'].results;
    const regionData = provResults[region] || provResults['IN'] || provResults['US'];
    if (regionData) {
      const flatrate = regionData.flatrate || [];
      const ads = regionData.ads || [];
      streamingProviders = [...flatrate, ...ads].map(p => p.provider_name);
    }
  }

  // Deduplicate streaming providers
  streamingProviders = [...new Set(streamingProviders)];

  // Poster & Backdrop full URLs
  let poster = movie.poster_path;
  if (poster && !poster.startsWith('http')) {
    poster = `${IMAGE_BASE_URL}/w500${poster}`;
  }
  let backdrop = movie.backdrop_path;
  if (backdrop && !backdrop.startsWith('http')) {
    backdrop = `${IMAGE_BASE_URL}/original${backdrop}`;
  }

  const movieId = movie._id ? movie._id.toString() : (movie.id || movie.tmdb_id);
  return {
    id: movieId,
    _id: movie._id ? movie._id.toString() : undefined,
    title: movie.title || movie.name || 'Untitled',
    overview: movie.overview || 'No overview available.',
    release_date: releaseDate,
    year,
    runtime: typeof movie.runtime === 'number' && movie.runtime > 0 ? movie.runtime : null,
    vote_average: typeof movie.vote_average === 'number' ? Math.round(movie.vote_average * 10) / 10 : null,
    vote_count: movie.vote_count || 0,
    poster_path: poster || null,
    backdrop_path: backdrop || null,
    genres,
    genre_ids: movie.genre_ids || (Array.isArray(movie.genres) ? movie.genres.map(g => g.id).filter(Boolean) : []),
    director,
    cast,
    streaming_providers: streamingProviders
  };
}

export async function getGenres() {
  const cacheKey = 'genres_list';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!isApiKeyConfigured()) {
    return FALLBACK_GENRES;
  }

  try {
    const { headers, params } = getAxiosConfig();
    const res = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      headers,
      params: { ...params, language: 'en-US' },
      timeout: 6000
    });
    const genres = res.data.genres || FALLBACK_GENRES;
    setCache(cacheKey, genres);
    return genres;
  } catch (err) {
    console.error('TMDB getGenres error:', err.message);
    return FALLBACK_GENRES;
  }
}

export async function searchPerson(query) {
  if (!query || query.trim().length === 0) return [];
  const cacheKey = `person_${query.trim().toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!isApiKeyConfigured()) {
    const q = query.toLowerCase();
    // Return matching fallback persons
    const results = [];
    FALLBACK_MOVIES.forEach(m => {
      if (m.director && m.director.toLowerCase().includes(q)) {
        if (!results.some(r => r.name === m.director)) {
          results.push({ id: 99000 + results.length, name: m.director, known_for_department: 'Directing' });
        }
      }
      m.cast.forEach(c => {
        if (c.toLowerCase().includes(q) && !results.some(r => r.name === c)) {
          results.push({ id: 88000 + results.length, name: c, known_for_department: 'Acting' });
        }
      });
    });
    return results.slice(0, 10);
  }

  try {
    const { headers, params } = getAxiosConfig();
    const res = await axios.get(`${TMDB_BASE_URL}/search/person`, {
      headers,
      params: { ...params, query: query.trim(), language: 'en-US', page: 1 },
      timeout: 6000
    });
    const list = (res.data.results || []).slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      profile_path: p.profile_path ? `${IMAGE_BASE_URL}/w185${p.profile_path}` : null,
      known_for_department: p.known_for_department
    }));
    setCache(cacheKey, list);
    return list;
  } catch (err) {
    console.error('TMDB searchPerson error:', err.message);
    return [];
  }
}

export async function getCandidates(filters = {}, region = 'IN') {
  if (!isApiKeyConfigured()) {
    if (isDbConnected()) {
      try {
        const dbMovies = await Movie.find();
        if (dbMovies && dbMovies.length > 0) {
          return dbMovies.map(m => normalizeMovie(m.toObject(), region));
        }
      } catch (err) {
        console.warn('Error reading movies from MongoDB for candidates:', err.message);
      }
    }
    return FALLBACK_MOVIES.map(m => normalizeMovie(m, region));
  }

  const cacheKey = `candidates_${JSON.stringify(filters)}_${region}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { headers, params } = getAxiosConfig();
    let moviesRaw = [];

    // If a title query is present, search by title first
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const res = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        headers,
        params: {
          ...params,
          query: filters.searchQuery.trim(),
          include_adult: false,
          page: 1
        },
        timeout: 7000
      });
      moviesRaw = (res.data.results || []).slice(0, 25);
    } else {
      // Build discover query params
      const discoverParams = {
        ...params,
        include_adult: false,
        include_video: false,
        language: 'en-US',
        sort_by: 'popularity.desc',
        'vote_count.gte': 80,
        page: 1
      };

      // If genre filter is active, pass it to discover
      if (filters.genreId) {
        discoverParams.with_genres = filters.genreId;
      }
      // If director or cast person IDs are supplied
      if (filters.personId) {
        discoverParams.with_people = filters.personId;
      }
      if (filters.year) {
        discoverParams.primary_release_year = filters.year;
      }

      // Fetch 2 pages of discover results (up to 40 items) to guarantee diverse candidate pool
      const [page1, page2] = await Promise.allSettled([
        axios.get(`${TMDB_BASE_URL}/discover/movie`, { headers, params: { ...discoverParams, page: 1 }, timeout: 7000 }),
        axios.get(`${TMDB_BASE_URL}/discover/movie`, { headers, params: { ...discoverParams, page: 2 }, timeout: 7000 })
      ]);

      if (page1.status === 'fulfilled' && page1.value.data.results) {
        moviesRaw.push(...page1.value.data.results);
      }
      if (page2.status === 'fulfilled' && page2.value.data.results) {
        moviesRaw.push(...page2.value.data.results);
      }
    }

    if (moviesRaw.length === 0) {
      return FALLBACK_MOVIES.map(m => normalizeMovie(m, region));
    }

    // Deduplicate
    const uniqueMap = new Map();
    moviesRaw.forEach(m => {
      if (!uniqueMap.has(m.id)) uniqueMap.set(m.id, m);
    });
    const candidateList = Array.from(uniqueMap.values()).slice(0, 30);

    // Fetch credits, watch/providers, and runtime for each candidate movie
    const detailedPromises = candidateList.map(async (m) => {
      const movieCacheKey = `movie_full_${m.id}_${region}`;
      const cachedMovie = getCached(movieCacheKey);
      if (cachedMovie) return cachedMovie;

      try {
        const detailsRes = await axios.get(`${TMDB_BASE_URL}/movie/${m.id}`, {
          headers,
          params: {
            ...params,
            append_to_response: 'credits,watch/providers'
          },
          timeout: 5000
        });
        const normalized = normalizeMovie(detailsRes.data, region);
        setCache(movieCacheKey, normalized);
        return normalized;
      } catch (err) {
        // Fallback to basic normalized movie without full details
        return normalizeMovie(m, region);
      }
    });

    const populatedCandidates = await Promise.all(detailedPromises);
    setCache(cacheKey, populatedCandidates);
    return populatedCandidates;

  } catch (err) {
    console.error('TMDB getCandidates error:', err.message);
    return FALLBACK_MOVIES.map(m => normalizeMovie(m, region));
  }
}

export async function getMovieDetails(id, region = 'IN') {
  const cacheKey = `movie_details_${id}_${region}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!isApiKeyConfigured()) {
    const movie = FALLBACK_MOVIES.find(m => String(m.id) === String(id));
    if (movie) return normalizeMovie(movie, region);
    return null;
  }

  try {
    const { headers, params } = getAxiosConfig();
    const res = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      headers,
      params: {
        ...params,
        append_to_response: 'credits,watch/providers,videos,recommendations'
      },
      timeout: 7000
    });
    const normalized = normalizeMovie(res.data, region);
    // Include full cast and director details
    if (res.data.credits) {
      normalized.fullCast = (res.data.credits.cast || []).slice(0, 15).map(c => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path ? `${IMAGE_BASE_URL}/w185${c.profile_path}` : null
      }));
      const dirObj = (res.data.credits.crew || []).find(c => c.job === 'Director');
      if (dirObj) {
        normalized.directorId = dirObj.id;
        normalized.director = dirObj.name;
      }
    }
    // Include YouTube trailer if available
    if (res.data.videos?.results) {
      const trailer = res.data.videos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      if (trailer) {
        normalized.trailerKey = trailer.key;
      }
    }
    setCache(cacheKey, normalized);
    return normalized;
  } catch (err) {
    console.error('TMDB getMovieDetails error:', err.message);
    const movie = FALLBACK_MOVIES.find(m => String(m.id) === String(id));
    return movie ? normalizeMovie(movie, region) : null;
  }
}

export async function getDirectorDetails(id) {
  const cacheKey = `director_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!isApiKeyConfigured()) {
    return {
      id,
      name: "Acclaimed Director",
      biography: "A visionary filmmaker known for genre-defying cinematic masterworks.",
      profile_path: null,
      known_for_department: "Directing",
      movies: FALLBACK_MOVIES.slice(0, 4).map(m => ({ id: m.id, title: m.title, year: m.year, poster_path: m.poster_path }))
    };
  }

  try {
    const { headers, params } = getAxiosConfig();
    const res = await axios.get(`${TMDB_BASE_URL}/person/${id}`, {
      headers,
      params: {
        ...params,
        append_to_response: 'movie_credits'
      },
      timeout: 7000
    });

    const data = res.data;
    const directedMovies = (data.movie_credits?.crew || [])
      .filter(c => c.job === 'Director')
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 12)
      .map(m => ({
        id: m.id,
        title: m.title,
        year: m.release_date ? parseInt(m.release_date.substring(0, 4), 10) : null,
        poster_path: m.poster_path ? `${IMAGE_BASE_URL}/w342${m.poster_path}` : null,
        vote_average: m.vote_average
      }));

    const details = {
      id: data.id,
      name: data.name,
      biography: data.biography || "No biography available.",
      birthday: data.birthday,
      place_of_birth: data.place_of_birth,
      profile_path: data.profile_path ? `${IMAGE_BASE_URL}/w300${data.profile_path}` : null,
      known_for_department: data.known_for_department || "Directing",
      movies: directedMovies
    };

    setCache(cacheKey, details);
    return details;
  } catch (err) {
    console.error('TMDB getDirectorDetails error:', err.message);
    return null;
  }
}
