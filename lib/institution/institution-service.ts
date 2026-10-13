/**
 * lib/institution/institution-service.ts
 * COGNALYZE ACADEMIC INSTITUTION & COLLEGE DIRECTORY SERVICE
 * 
 * Directory and autocomplete provider for:
 * 1. Indian Premier Institutes (IITs, NITs, IIITs, BITS, DTU, NSUT)
 * 2. Renowned State & Autonomous Colleges (ABES Engineering College, Ghaziabad; BMS College of Engineering; etc.)
 * 3. Central & State Universities
 * 4. Documented manual entry handling without silent replacement
 * 5. Strict separation of institution identity from student attendance verification
 */

export interface NormalizedInstitution {
  id: string;
  name: string;
  type: "Institute of National Importance" | "Central University" | "State University" | "Autonomous Engineering College" | "Private University" | "College";
  city: string;
  state: string;
  country: string;
  website?: string;
  isManual: boolean;
  isVerified: boolean;
  attendanceVerified: boolean;
}

const CANONICAL_INSTITUTION_DIRECTORY: Omit<NormalizedInstitution, "id" | "isManual" | "isVerified" | "attendanceVerified">[] = [
  // Delhi NCR & Uttar Pradesh
  {
    name: "ABES Engineering College, Ghaziabad",
    type: "Autonomous Engineering College",
    city: "Ghaziabad",
    state: "Uttar Pradesh",
    country: "India",
    website: "https://abes.ac.in"
  },
  {
    name: "AKGEC - Ajay Kumar Garg Engineering College, Ghaziabad",
    type: "Autonomous Engineering College",
    city: "Ghaziabad",
    state: "Uttar Pradesh",
    country: "India",
    website: "https://akgec.ac.in"
  },
  {
    name: "KIET Group of Institutions, Ghaziabad",
    type: "Autonomous Engineering College",
    city: "Ghaziabad",
    state: "Uttar Pradesh",
    country: "India",
    website: "https://kiet.edu"
  },
  {
    name: "Indian Institute of Technology Delhi (IIT Delhi)",
    type: "Institute of National Importance",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    website: "https://home.iitd.ac.in"
  },
  {
    name: "Delhi Technological University (DTU)",
    type: "State University",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    website: "https://dtu.ac.in"
  },
  {
    name: "Netaji Subhas University of Technology (NSUT)",
    type: "State University",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    website: "http://nsut.ac.in"
  },
  {
    name: "Indraprastha Institute of Information Technology Delhi (IIIT Delhi)",
    type: "State University",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    website: "https://iiitd.ac.in"
  },
  {
    name: "Indian Institute of Technology Kanpur (IIT Kanpur)",
    type: "Institute of National Importance",
    city: "Kanpur",
    state: "Uttar Pradesh",
    country: "India",
    website: "https://iitk.ac.in"
  },
  {
    name: "Indian Institute of Technology (BHU) Varanasi",
    type: "Institute of National Importance",
    city: "Varanasi",
    state: "Uttar Pradesh",
    country: "India",
    website: "https://iitbhu.ac.in"
  },
  {
    name: "Motilal Nehru National Institute of Technology (MNNIT Allahabad)",
    type: "Institute of National Importance",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    country: "India",
    website: "http://mnnit.ac.in"
  },
  {
    name: "Harcourt Butler Technical University (HBTU Kanpur)",
    type: "State University",
    city: "Kanpur",
    state: "Uttar Pradesh",
    country: "India",
    website: "https://hbtu.ac.in"
  },
  {
    name: "JSS Academy of Technical Education, Noida",
    type: "College",
    city: "Noida",
    state: "Uttar Pradesh",
    country: "India",
    website: "https://jssaten.ac.in"
  },

  // Karnataka & South
  {
    name: "BMS College of Engineering, Bengaluru",
    type: "Autonomous Engineering College",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    website: "https://bmsce.ac.in"
  },
  {
    name: "Indian Institute of Science (IISc Bengaluru)",
    type: "Institute of National Importance",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    website: "https://iisc.ac.in"
  },
  {
    name: "RV College of Engineering (RVCE), Bengaluru",
    type: "Autonomous Engineering College",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    website: "https://rvce.edu.in"
  },
  {
    name: "PES University, Bengaluru",
    type: "Private University",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    website: "https://pes.edu"
  },
  {
    name: "National Institute of Technology Karnataka (NIT Surathkal)",
    type: "Institute of National Importance",
    city: "Mangaluru",
    state: "Karnataka",
    country: "India",
    website: "https://nitk.ac.in"
  },
  {
    name: "Indian Institute of Technology Madras (IIT Madras)",
    type: "Institute of National Importance",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://iitm.ac.in"
  },
  {
    name: "National Institute of Technology Tiruchirappalli (NIT Trichy)",
    type: "Institute of National Importance",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    country: "India",
    website: "https://nitt.edu"
  },
  {
    name: "Vellore Institute of Technology (VIT), Vellore",
    type: "Private University",
    city: "Vellore",
    state: "Tamil Nadu",
    country: "India",
    website: "https://vit.ac.in"
  },
  {
    name: "PSG College of Technology, Coimbatore",
    type: "Autonomous Engineering College",
    city: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    website: "https://psgtech.edu"
  },

  // Telangana & Andhra Pradesh
  {
    name: "Indian Institute of Technology Hyderabad (IIT Hyderabad)",
    type: "Institute of National Importance",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    website: "https://iith.ac.in"
  },
  {
    name: "International Institute of Information Technology Hyderabad (IIIT Hyderabad)",
    type: "Autonomous Engineering College",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    website: "https://iiit.ac.in"
  },
  {
    name: "National Institute of Technology Warangal (NIT Warangal)",
    type: "Institute of National Importance",
    city: "Warangal",
    state: "Telangana",
    country: "India",
    website: "https://nitw.ac.in"
  },
  {
    name: "BITS Pilani, Hyderabad Campus",
    type: "Private University",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    website: "https://bits-pilani.ac.in/hyderabad"
  },

  // Maharashtra & West
  {
    name: "Indian Institute of Technology Bombay (IIT Bombay)",
    type: "Institute of National Importance",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    website: "https://iitb.ac.in"
  },
  {
    name: "College of Engineering, Pune (COEP)",
    type: "State University",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    website: "https://coeptech.ac.in"
  },
  {
    name: "Veermata Jijabai Technological Institute (VJTI Mumbai)",
    type: "Autonomous Engineering College",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    website: "https://vjti.ac.in"
  },
  {
    name: "Visvesvaraya National Institute of Technology (VNIT Nagpur)",
    type: "Institute of National Importance",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    website: "https://vnit.ac.in"
  },
  {
    name: "BITS Pilani, Goa Campus",
    type: "Private University",
    city: "Goa",
    state: "Goa",
    country: "India",
    website: "https://bits-pilani.ac.in/goa"
  },

  // Rajasthan & North
  {
    name: "BITS Pilani (Birla Institute of Technology and Science, Pilani)",
    type: "Private University",
    city: "Pilani",
    state: "Rajasthan",
    country: "India",
    website: "https://bits-pilani.ac.in"
  },
  {
    name: "Indian Institute of Technology Roorkee (IIT Roorkee)",
    type: "Institute of National Importance",
    city: "Roorkee",
    state: "Uttarakhand",
    country: "India",
    website: "https://iitr.ac.in"
  },
  {
    name: "Malaviya National Institute of Technology (MNIT Jaipur)",
    type: "Institute of National Importance",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    website: "https://mnit.ac.in"
  },
  {
    name: "Thapar Institute of Engineering and Technology, Patiala",
    type: "Private University",
    city: "Patiala",
    state: "Punjab",
    country: "India",
    website: "https://thapar.edu"
  },

  // West Bengal & East
  {
    name: "Indian Institute of Technology Kharagpur (IIT Kharagpur)",
    type: "Institute of National Importance",
    city: "Kharagpur",
    state: "West Bengal",
    country: "India",
    website: "https://iitkgp.ac.in"
  },
  {
    name: "Jadavpur University, Kolkata",
    type: "State University",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    website: "http://jaduniv.edu.in"
  },
  {
    name: "National Institute of Technology Rourkela (NIT Rourkela)",
    type: "Institute of National Importance",
    city: "Rourkela",
    state: "Odisha",
    country: "India",
    website: "https://nitrkl.ac.in"
  },
  {
    name: "Indian Institute of Technology Guwahati (IIT Guwahati)",
    type: "Institute of National Importance",
    city: "Guwahati",
    state: "Assam",
    country: "India",
    website: "https://iitg.ac.in"
  }
];

/**
 * Searches academic institutions matching a query string.
 */
export async function searchInstitutions(query: string): Promise<NormalizedInstitution[]> {
  const q = (query || "").trim().toLowerCase();
  if (q.length < 2) return [];

  const matched = CANONICAL_INSTITUTION_DIRECTORY.filter((inst) => {
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.city.toLowerCase().includes(q) ||
      inst.state.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  return matched.map((inst, idx) => ({
    id: `inst-canon-${idx}-${inst.city.toLowerCase()}`,
    ...inst,
    isManual: false,
    isVerified: true,
    attendanceVerified: false // Attendance is distinct from directory presence
  }));
}

/**
 * Normalizes an arbitrary institution entry.
 * If found in directory, returns verified institution record.
 * If absent, preserves the exact student-entered name, marked as manual entry.
 * Never silently substitutes with a different institution.
 */
export function normalizeInstitution(rawName: string): NormalizedInstitution {
  const trimmed = (rawName || "").trim();
  if (!trimmed) {
    return {
      id: "inst-empty",
      name: "",
      type: "College",
      city: "",
      state: "",
      country: "",
      isManual: true,
      isVerified: false,
      attendanceVerified: false
    };
  }

  const found = CANONICAL_INSTITUTION_DIRECTORY.find(
    (inst) => inst.name.toLowerCase() === trimmed.toLowerCase()
  );

  if (found) {
    return {
      id: `inst-canon-${found.city.toLowerCase()}`,
      ...found,
      isManual: false,
      isVerified: true,
      attendanceVerified: false
    };
  }

  // Preserves exact student-entered name without silent replacement
  return {
    id: `inst-manual-${Date.now()}`,
    name: trimmed,
    type: "College",
    city: "",
    state: "",
    country: "India",
    isManual: true,
    isVerified: false,
    attendanceVerified: false
  };
}
