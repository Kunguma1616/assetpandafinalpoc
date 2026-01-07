import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { toast } from 'sonner';
import {
  Upload as UploadIcon,
  Loader2,
  LogOut,
  LayoutDashboard,
  Search,
  PoundSterling
} from 'lucide-react';

// FULL LIST OF 187 ENGINEERS FROM CSV
const ENGINEERS = [
  { id: "0Hn4G0000004CZBSA2", name: "Murray Kemp (DA7)" },
  { id: "0Hn4G0000004CZQSA2", name: "Alin Olaru (UB10)" },
  { id: "0Hn4G0000008PCCSA2", name: "Antons Laricevs (HP3)" },
  { id: "0Hn4G0000008PESSA2", name: "Otis Bizley (SW16)" },
  { id: "0Hn4G0000008PKBSA2", name: "Benjamin Smith (SE17) PF + UV + OFTECH" },
  { id: "0Hn4G0000008PKVSA2", name: "Samuel Gebregziabiher (SE6)" },
  { id: "0Hn4G0000008PMMSA2", name: "Lukasz Zareba CR4" },
  { id: "0Hn4G0000008PWoSAM", name: "Aaron Lovell-(BR2)" },
  { id: "0Hn4G0000008PkRSAU", name: "Leon Olive (CT13 0EA)" },
  { id: "0Hn4G000000CbhCSAS", name: "David Thain (KEY ACCOUNT)" },
  { id: "0Hn4G000000CeFISA0", name: "Luke Jackson ( SS2)" },
  { id: "0Hn4G000000CfZdSAK", name: "Lee Wilson (SM6) - UV + GC + GF + CG" },
  { id: "0Hn4G000000CfiGSAS", name: "Atam Sandhu (IG8 )" },
  { id: "0Hn4G000000Ci07SAC", name: "Daniel Steenvoorden (CM17)" },
  { id: "0Hn4G000000CjKXSA0", name: "Corneliu-Cezar Covataru (TW20)" },
  { id: "0Hn4G000000CjKcSAK", name: "Perry Franks Wiseman (RM12) + Tanker" },
  { id: "0Hn4G000000CjPhSAK", name: "Connor Watson (KT19)" },
  { id: "0Hn4G000000CkW0SAK", name: "Karol Makarewicz (HA0) - UV + MT" },
  { id: "0Hn4G000000ClBrSAK", name: "Calum Jones (RM16)" },
  { id: "0Hn4G000000CoQuSAK", name: "Bradley Poole (CM16)" },
  { id: "0Hn4G000000Cp5JSAS", name: "Krystian Strzelec (SM1)" },
  { id: "0Hn4G000000CpFOSA0", name: "Harvey Murray (BR5)" },
  { id: "0Hn4G000000CqivSAC", name: "Daniel Kavanagh (SS7)" },
  { id: "0Hn4G000000CroLSAS", name: "Samuel Hall (CM16)" },
  { id: "0Hn4G000000GnMESA0", name: "Sam Pow (DA1) + PAT" },
  { id: "0Hn4G000000GnMFSA0", name: "Patrick Read (PAT)(SW16)" },
  { id: "0Hn4G000000GnMISA0", name: "Luciano Tamos +PL (W3)" },
  { id: "0Hn4G000000GnMVSA0", name: "David Farr (UB1)" },
  { id: "0Hn4G000000GnMhSAK", name: "Trevor Smith (DA6)" },
  { id: "0Hn4G000000GnMoSAK", name: "Adam Shiels (EC1V) + TJ" },
  { id: "0Hn4G000000GnNASA0", name: "Marek Kwasnik (SG2)" },
  { id: "0Hn4G000000GnNLSA0", name: "Martin Fisher (TW8)" },
  { id: "0Hn4G000000GnNOSA0", name: "Deyan Cherkezov(CM2)" },
  { id: "0Hn4G000000GnNQSA0", name: "John Thorne (DA1)" },
  { id: "0Hn4G000000Got3SAC", name: "Giacomo Fraternale (E7)" },
  { id: "0Hn4G000000Got8SAC", name: "Angjelin Deda (SE7) - UV" },
  { id: "0Hn4G000000Gp2ASAS", name: "Ricky Micheli (E4) NOT CATERING + GF + GC + UV + PF" },
  { id: "0Hn4G000000GpMeSAK", name: "Luke Cashin (HP19)" },
  { id: "0Hn4G000000GpcmSAC", name: "Marius Kunigelis (HP13)" },
  { id: "0Hn4G000000GrDtSAK", name: "Michael Hall (CT5)" },
  { id: "0Hn4G000000GwYrSAK", name: "Christopher Clarke (SW20)" },
  { id: "0Hn4G000000GyYPSA0", name: "Rickesh Mehta (HA9) + GF + GC + MT + PF" },
  { id: "0Hn4G000000L1bUSAS", name: "Bradley Wells (N12)" },
  { id: "0Hn4G000000L1bZSAS", name: "Pieter Steyn (ME15)" },
  { id: "0Hn4G000000L1kRSAS", name: "David-Silvan Dolea (IG6)" },
  { id: "0Hn4G000000L1mXSAS", name: "Shoaib Hussain (GU15) - + GF + GC + UV + PF" },
  { id: "0Hn4G000000L372SAC", name: "Tarik Fariji (ME19) + TJ" },
  { id: "0Hn4G000000L3DySAK", name: "Ramanjit Puaar (IG3) -+ GF + GC + UV + PF" },
  { id: "0Hn4G000000L3IeSAK", name: "Ahmed Belafkih (IG1)" },
  { id: "0Hn4G000000L3JrSAK", name: "Michael Houareau (IG10)" },
  { id: "0Hn4G000000L3OwSAK", name: "Csaba Nyako (ME16)" },
  { id: "0Hn4G000000L3QTSA0", name: "Ali Tolali (E4) No boiler repairs + GF + GC + MT" },
  { id: "0Hn4G000000L3YDSA0", name: "Aleksander Deda (SE7) GAS, PL, UV" },
  { id: "0Hn4G000000L3gWSAS", name: "Pawel Skalbania + PL (AL7)" },
  { id: "0Hn4G000000L3oQSAS", name: "Wesley Scafe + PL (TN8)" },
  { id: "0Hn4G000000L3oaSAC", name: "Paul Hobson (EN7)" },
  { id: "0Hn4G000000L3psSAC", name: "Lee Mincher + PL (DA1) + TJ + UV" },
  { id: "0Hn4G000000L3w5SAC", name: "Connor Nash (BR2) + TJ" },
  { id: "0Hn4G000000L6PESA0", name: "Benjamin Charles (DA4)" },
  { id: "0Hn4G000000L6dLSAS", name: "John Wheeler (SE20)" },
  { id: "0Hn4G000000L8DeSAK", name: "Henry Schimanski" },
  { id: "0Hn4G000000PCt3SAG", name: "Aurel Dara (EN8) NO PL" },
  { id: "0Hn4G000000PCtaSAG", name: "David Howard +PL+BP (SG2)" },
  { id: "0Hn4G000000PCtcSAG", name: "David Sanger (E11) + TJ" },
  { id: "0Hn4G000000PCtnSAG", name: "Laszlo Bartha (E6)" },
  { id: "0Hn4G000000PCuLSAW", name: "Gheorghe-Florin Dogaru" },
  { id: "0Hn4G000000PCv7SAG", name: "Tom Bizley (SW)" },
  { id: "0Hn4G000000PECxSAO", name: "Nasa Luzze (DA12)" },
  { id: "0Hn4G000000PEDbSAO", name: "Shane Rumney (TN10) + TJ" },
  { id: "0Hn4G000000PEPNSA4", name: "Alban Gjonaj (RM12)" },
  { id: "0Hn4G000000PEcHSAW", name: "Daniel Green (RH1) + TJ" },
  { id: "0Hn4G000000PEgdSAG", name: "Maxwell Hawkes-Freeman (SE9)" },
  { id: "0Hn4G000000PEjXSAW", name: "Alexandr Nepomneascii(TW7)" },
  { id: "0Hn4G000000PGbzSAG", name: "Barry Ney (HA9)" },
  { id: "0Hn4G000000TPs8SAG", name: "Georgi Popov (SM5 )" },
  { id: "0Hn4G000000TQa0SAG", name: "Florin Puscasu (RM10)" },
  { id: "0Hn4G000000TQdESAW", name: "Samuel Bromley (W6)" },
  { id: "0Hn4G000000TSklSAG", name: "Neale Gould (CR0)" },
  { id: "0HnJ50000004CDtKAM", name: "James McLean (E4)" },
  { id: "0HnJ50000004D0lKAE", name: "Trevor Grayston (CM24) + G" },
  { id: "0HnJ50000004DzAKAU", name: "Tristan Upton (HP11) + Tanker" },
  { id: "0HnJ50000004EKIKA2", name: "Kliton Rondo (E4) - PF & UV & GF + GC + MT + HIU" },
  { id: "0HnJ50000004InnKAE", name: "Michael Moore (TW11)" },
  { id: "0HnJ50000004JQaKAM", name: "Paul Brockhouse (B26)" },
  { id: "0HnJ50000004JWJKA2", name: "James Luffingham (GU46)" },
  { id: "0HnJ50000004JyXKAU", name: "Francis Doherty (SE26)" },
  { id: "0HnJ50000004JycKAE", name: "Kenneth Cox (N8) +G" },
  { id: "0HnJ50000004KCKKA2", name: "Charles Mitchell (TN11 ) + HVAC + NO PL" },
  { id: "0HnJ50000004KYBKA2", name: "Liam Butcher +G (DA4)" },
  { id: "0HnWS00000015aL0AQ", name: "Mohamed Khalifa (GU21)" },
  { id: "0HnWS00000017Dx0AI", name: "Kristian Ivanov ( GL15) + (E16)" },
  { id: "0HnWS0000001ATZ0A2", name: "Daniel Linford (SE28)" },
  { id: "0HnWS0000001hkT0AQ", name: "Guxim Paci (N12) GC + GF + UV" },
  { id: "0HnWS00000022qX0AQ", name: "Daniel Linkson (WD)" },
  { id: "0HnWS0000002H1Z0AU", name: "Elton Sampanai (NW4)" },
  { id: "0HnWS0000002X6L0AU", name: "Gurpreet Sull (DA1)" },
  { id: "0HnWS0000002iHt0AI", name: "Pawel Mojzuk (KT19)" },
  { id: "0HnWS0000002tZt0AI", name: "Jebb Hughes (E4)" },
  { id: "0HnWS0000002wr70AA", name: "Connor Brockhouse (B26)" },
  { id: "0HnWS0000003FIf0AM", name: "Rhys Jones (KT9) + GC" },
  { id: "0HnWS0000003slR0AQ", name: "Ethan Hudson (N15)" },
  { id: "0HnWS00000042Pp0AI", name: "Kai Grant (CR0)" },
  { id: "0HnWS00000050gv0AA", name: "Milan Haxhiu (RM13)" },
  { id: "0HnWS00000050ll0AA", name: "Brian Costello (SL2)" },
  { id: "0HnWS0000005Apx0AE", name: "James Yeabsley" },
  { id: "0HnWS0000005Hcv0AE", name: "Manan Anwari (E10)" },
  { id: "0HnWS0000005V6P0AU", name: "Benjamin Hamshere (AL7)" },
  { id: "0HnWS0000005spN0AQ", name: "William Willoughby (SM6) + GF + GC + PF" },
  { id: "0HnWS0000005wxp0AA", name: "Celik Hodaj (EN14LA)" },
  { id: "0HnWS0000005znd0AA", name: "Dean Micheli (CM5)" },
  { id: "0HnWS0000005zqr0AA", name: "Aaron Vaughan (CO15)" },
  { id: "0HnWS00000060oX0AQ", name: "Klaudi Grishaj (N13)" },
  { id: "0HnWS0000006Hiv0AE", name: "Shane Brady (EN1)" },
  { id: "0HnWS0000006MsH0AU", name: "Gary Taylor (N7)" },
  { id: "0HnWS0000006RaD0AU", name: "Kalidur Rahman (E10)" },
  { id: "0HnWS0000006XhF0AU", name: "Shane Muncey (Se27)" },
  { id: "0HnWS0000006ayT0AQ", name: "Shaun Miles (BR2)" },
  { id: "0HnWS0000006hOr0AI", name: "Samuel Thornton (KT11)" },
  { id: "0HnWS0000006pXh0AI", name: "Joseph Stedman (TW2) UV" },
  { id: "0HnWS0000006pcX0AQ", name: "Mario Fazendeiro Pereira (ME4)" },
  { id: "0HnWS0000006rUf0AI", name: "Abdulwajed Nourestani (E4)" },
  { id: "0HnWS00000072BZ0AY", name: "Fisnik Pacoli (W2)" },
  { id: "0HnWS00000076VJ0AY", name: "Fateh Zerfa (SE20) + GC" },
  { id: "0HnWS0000007jtF0AQ", name: "Roosbeh Mashadi (N12)" },
  { id: "0HnWS0000007yM10AI", name: "Adam Osko (EN3)" },
  { id: "0HnWS0000008B6L0AU", name: "Richard Williscroft (KT5)" },
  { id: "0HnWS0000008Oht0AE", name: "Robert Lamb (EN1)" },
  { id: "0HnWS0000008Vxt0AE", name: "Montel Odufuye (IG8)" },
  { id: "0HnWS0000008W2j0AE", name: "Lewis Blackman (CO15)" },
  { id: "0HnWS0000008Yan0AE", name: "Nicolas Haggard (GU5)" },
  { id: "0HnWS0000008cJR0AY", name: "Ali Soltani Hafshejani (NW9) Gas Boilers + UV+PF" },
  { id: "0HnWS0000008xnh0AA", name: "Kieron Sinclair (CR0)" },
  { id: "0HnWS0000009L6r0AE", name: "Aaron Ball (RM18)" },
  { id: "0HnWS0000009St70AE", name: "Alex Guvenler (CM7)" },
  { id: "0HnWS0000009Suj0AE", name: "Duke Bizley" },
  { id: "0HnWS0000009iwH0AQ", name: "Peter Mulligan (W11)" },
  { id: "0HnWS0000009ixt0AA", name: "Wale Adeyanju (E12)" },
  { id: "0HnWS0000009nXl0AI", name: "Mohamed Bah (SS17)" },
  { id: "0HnWS000000A6vN0AS", name: "Daniel Anderson (KT21)" },
  { id: "0HnWS000000AFFV0A4", name: "Bektash Pira (EN5)" },
  { id: "0HnWS000000APMv0AO", name: "Aaron Hemmings (EN11)" },
  { id: "0HnWS000000AbO50AK", name: "Daniel Caney (ME5)" },
  { id: "0HnWS000000AbPh0AK", name: "Liam Gill (CM0)" },
  { id: "0HnWS000000AbRJ0A0", name: "Jyrgen Kola (E8)" },
  { id: "0HnWS000000AiFt0AK", name: "Deniz Okcay (EN8)" },
  { id: "0HnWS000000AwHF0A0", name: "Lee Kyranides (EN9)" },
  { id: "0HnWS000000AyNt0AK", name: "Vinnie Saunders (BR2)" },
  { id: "0HnWS000000B4LF0A0", name: "Haydn Batin (ME7)" },
  { id: "0HnWS000000B6Jp0AK", name: "Kadeem Spencer (SE6) No Gas Works" },
  { id: "0HnWS000000BAYj0AO", name: "Zachary Phillips (DA12)" },
  { id: "0HnWS000000BIXt0AO", name: "Mahmoud Mansour Ghazy (HA4)" },
  { id: "0HnWS000000BKg90AG", name: "Jadd Bentick (IG8)" },
  { id: "0HnWS000000BOyH0AW", name: "Emre Otun (EN8)" },
  { id: "0HnWS000000Bf9V0AS", name: "Oliver Burns (RG6)" },
  { id: "0HnWS000000Bl5F0AS", name: "Jan Tyson (WD25)" },
  { id: "0HnWS000000Bn0b0AC", name: "Jordan Stewart (N15)" },
  { id: "0HnWS000000BzwD0AS", name: "Mark Gill (CM0)" },
  { id: "0HnWS000000C2aj0AC", name: "Jason Watson (N1) UV + LPG + WA-DOM + GC + GF + MT + CG" },
  { id: "0HnWS000000CJuv0AG", name: "Manuel Shehi (KT15)" },
  { id: "0HnWS000000CMHh0AO", name: "James Bryant (TW13)" },
  { id: "0HnWS000000CUS90AO", name: "Fisnik Perjuci (WC1X) UV+HIU+GC+GF+MT1" },
  { id: "0HnWS000000CcuL0AS", name: "Harvey Carter (KT14)" },
  { id: "0HnWS000000CioT0AS", name: "Amardeep Gola (EN1) GF + GC + MT" },
  { id: "0HnWS000000CkyL0AS", name: "Blerim Pacolli (NW6)" },
  { id: "0HnWS000000CnOL0A0", name: "Matthew Willis (BR1)" },
  { id: "0HnWS000000CnPx0AK", name: "Frazer Griffin (PE28)" },
  { id: "0HnWS000000CpRl0AK", name: "Robert Wray (CR2)" },
  { id: "0HnWS000000CxQv0AK", name: "Alfie McGuire (W12)" },
  { id: "0HnWS000000D1ZN0A0", name: "Terry McDermott (CR2)" },
  { id: "0HnWS000000DC3N0AW", name: "Matthew Boyes (NW10) UV+GF+GC" },
  { id: "0HnWS000000DO690AG", name: "Dwayne Wilson (E5)" },
  { id: "0HnWS000000DO7l0AG", name: "Aaron Gale (MK18)" },
  { id: "0HnWS000000DQ9Z0AW", name: "Igor Bochentin (N20) UV + GC + GF + MT1 +" },
  { id: "0HnWS000000DRyT0AW", name: "Sean Bowden (TW9)" },
  { id: "0HnWS000000Db090AC", name: "Nathan Sango (KT4)" },
  { id: "0HnWS000000Db1l0AC", name: "Jay Webster (NW9)" },
  { id: "0HnWS000000DcsH0AS", name: "Thomas Gallagher (CR0)" },
  { id: "0HnWS000000Dctt0AC", name: "Artin Pacolli (NW6)" },
  { id: "0HnWS000000DhAP0A0", name: "Owen Taunton (AL9)" },
  { id: "0HnWS000000DjKH0A0", name: "Lewis Beeson (ME8)" },
  { id: "0HnWS000000DjLt0AK", name: "Rion Peters (SW16)" },
  { id: "0HnWS000000DpMT0A0", name: "Serhat Uysal (EN1)" },
  { id: "0HnWS000000DruX0AS", name: "Darren Podmore (SM5)" },
  { id: "0HnWS000000E7Xt0AK", name: "Daniel Nichols (SW6)" },
  { id: "0HnWS000000EEKr0AO", name: "Phillip Doyle" },
  { id: "0HnWS000000EEMT0A4", name: "Ryan Parkinson (NW5)" },
  { id: "0HnWS000000EMbl0AG", name: "Frankie  Mclintock (EN1)" },
].sort((a, b) => a.name.localeCompare(b.name));

// ASSETS WITH CORRECT ID (02i...) AND NAME FROM CSV - FULL LIST (3739 assets)
// Due to size, this includes representative sample - full data should be loaded from API
const ASSETS = [
  { id: "02i4G00000WcjrJQAR", name: "Test", assetNumber: "AST-0001" },
  { id: "02i4G00000WcjztQAB", name: "Dehumidifier DRIEAZ Revolution LGR BLUE ONE", assetNumber: "AST-0002" },
  { id: "02i4G00000WcjzyQAB", name: "Dehumidifier DRIZAIR 12 Dehumidifier 230V", assetNumber: "AST-0003" },
  { id: "02i4G00000Wck2JQAR", name: "Dehumidifier Koolbreze BLUE", assetNumber: "AST-0004" },
  { id: "02i4G00000Wck2OQAR", name: "Dehumidifier BIG GREY WCD4UKC", assetNumber: "AST-0005" },
  { id: "02i4G00000p3nJBQAY", name: "Vacuum pump 1", assetNumber: "AST-0006" },
  { id: "02i4G00000p3nyxQAA", name: "Aspect Polo Shirt - M - Test Engineer", assetNumber: "AST-0007" },
  { id: "02iJ5000001FXSDIA4", name: "Transformer - 230V - 110V - Flood kit - Jamie jones", assetNumber: "AST-0097" },
  { id: "02iJ5000001FXSEIA4", name: "Garden Lawn Mower ATCO QUATTRO 16S GREEN", assetNumber: "AST-0098" },
  { id: "02iJ5000001FXSFIA4", name: "Ladder 2.84mt Triple Ladder (A FRAME)", assetNumber: "AST-0099" },
  { id: "02iJ5000001FXSGIA4", name: "JS 110 Sub' Pump & 30mtr blue layflat hose - Flood Kit Jamie Jones", assetNumber: "AST-0100" },
  { id: "02iJ5000001FXSHIA4", name: "Vacuum / Cleaner NUMATIC CARPET CLEANER - BLUE", assetNumber: "AST-0101" },
  { id: "02iJ5000001FXSIIA4", name: "Ladder 1.60mt Step Ladder 6 Tread", assetNumber: "AST-0102" },
  { id: "02iJ5000001FXSJIA4", name: "Ladder 2.38 mt Step Ladder 8 Tread YELLOW", assetNumber: "AST-0103" },
  { id: "02iJ5000001FXSKIA4", name: "LEAK DET. KIT BOC gas regulator", assetNumber: "AST-0104" },
  { id: "02iJ5000001FXSLIA4", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder", assetNumber: "AST-0105" },
  { id: "02iJ5000001FXSMIA4", name: "LEAK DET. KIT Inspection camera Ridgid Ca-350X", assetNumber: "AST-0106" },
  { id: "02iJ5000001FXSNIA4", name: "LEAK DET. KIT Primayer Prime trace RXG-890/EN YELLOW ONE", assetNumber: "AST-0107" },
  { id: "02iJ5000001FXSOIA4", name: "LEAK DET. KIT SEWERIN AQUAPHON A200 - ORANGE CASE", assetNumber: "AST-0108" },
  { id: "02iJ5000001FXSPIA4", name: "LEAK DET. KIT Protimeter analysis kit MMS2 BLD4900 small pack", assetNumber: "AST-0109" },
  { id: "02iJ5000001FXSQIA4", name: "LEAK DET. KIT Protimeter MMS2 moisture meter BLD8800", assetNumber: "AST-0110" },
  { id: "02iJ5000001FXSRIA4", name: "LEAK DET. KIT Thermal imaging camera TESTO 865", assetNumber: "AST-0111" },
  { id: "02iJ5000001FXSSIA4", name: "Dehumidifier DRIEAZ Revolution LGR WHITE ONE", assetNumber: "AST-0112" },
  { id: "02iJ5000001FXSTIA4", name: "LEAK DET. KIT BOC gas regulator", assetNumber: "AST-0113" },
  { id: "02iJ5000001FXSUIA4", name: "LEAK DET. KIT BOC Gas Trolley", assetNumber: "AST-0114" },
  { id: "02iJ5000001FXSVIA4", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder", assetNumber: "AST-0115" },
  { id: "02iJ5000001FXSWIA4", name: "LEAK DET. KIT Inspection camera Ridgid CA-350X", assetNumber: "AST-0116" },
  { id: "02iJ5000001FXSXIA4", name: "LEAK DET. KIT Primayer Prime trace RXG-890/EN YELLOW ONE", assetNumber: "AST-0117" },
  { id: "02iJ5000001FXSYIA4", name: "LEAK DET. KIT SEWERIN AQUAPHON A200 - ORANGE CASE", assetNumber: "AST-0118" },
  { id: "02iJ5000001FXSZIA4", name: "LEAK DET. KIT Protimeter analysis kit MMS2 BLD4900 small pack", assetNumber: "AST-0119" },
  { id: "02iJ5000001FXSaIAO", name: "LEAK DET. KIT Protimeter MMS2 moisture meter BLD8800", assetNumber: "AST-0120" },
  { id: "02iJ5000001FXSbIAO", name: "LEAK DET. KIT Thermal imaging camera TESTO 865", assetNumber: "AST-0121" },
  { id: "02iJ5000001FXScIAO", name: "Drainage RIDGID cleaner machine kit K-45 240V + red metalbox", assetNumber: "AST-0122" },
  { id: "02iJ5000001FXSdIAO", name: "Velo Pro Airmover", assetNumber: "AST-0123" },
  { id: "02iJ5000001FXSeIAO", name: "Dehumidifier DRIEAZ Revolution LGR WHITE ONE", assetNumber: "AST-0124" },
  { id: "02iJ5000001FXSfIAO", name: "LEAK DET. KIT Primayer Prime trace RXG-890/EN YELLOW ONE", assetNumber: "AST-0125" },
  { id: "02iJ5000001FXSgIAO", name: "LEAK DET. KIT SEWERIN AQUAPHON A200 - ORANGE CASE", assetNumber: "AST-0126" },
  { id: "02iJ5000001FXShIAO", name: "LEAK DET. KIT Protimeter analysis kit MMS2 BLD4900 small pack", assetNumber: "AST-0127" },
  { id: "02iJ5000001FXSiIAO", name: "LEAK DET. KIT Protimeter MMS2 moisture meter BLD8800", assetNumber: "AST-0128" },
  { id: "02iJ5000001FXSjIAO", name: "LEAK DET. KIT Thermal imaging camera TESTO 865", assetNumber: "AST-0129" },
  { id: "02iJ5000001FXSkIAO", name: "LEAK DET. KIT BOC gas regulator", assetNumber: "AST-0130" },
  { id: "02iJ5000001FXSlIAO", name: "LEAK DET. KIT BOC gas regulator", assetNumber: "AST-0131" },
  { id: "02iJ5000001FXSmIAO", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder", assetNumber: "AST-0132" },
  { id: "02iJ5000001FXSnIAO", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder Hose - RED with fixings", assetNumber: "AST-0133" },
  { id: "02iJ5000001FXSoIAO", name: "Ladder 1.56mt Step Ladder 6 Tread", assetNumber: "AST-0134" },
  { id: "02iJ5000001FXSpIAO", name: "LEAK DET. KIT Inspection camera Ridgid Ca-350X", assetNumber: "AST-0135" },
  { id: "02iJ5000001FXSqIAO", name: "Leak Detection Rothenberger R30 Pressure Pump", assetNumber: "AST-0136" },
  { id: "02iJ5000001FXSrIAO", name: "LEAK DET. KIT BOC gas regulator", assetNumber: "AST-0137" },
  { id: "02iJ5000001FXSsIAO", name: "LEAK DET. KIT Inspection camera Ridgid Ca-350X", assetNumber: "AST-0138" },
  { id: "02iJ5000001FXStIAO", name: "LEAK DET. KIT K&F Concept industrial endoscope dual-lens inspection camera 1080P HD endoscope", assetNumber: "AST-0139" },
  { id: "02iJ5000001FXSuIAO", name: "LEAK DET. KIT Jacobs Sniffer 430", assetNumber: "AST-0140" },
  { id: "02iJ5000001FXSvIAO", name: "LEAK DET. KIT SEWERIN AQUAPHON A200 - ORANGE CASE", assetNumber: "AST-0141" },
  { id: "02iJ5000001FXSwIAO", name: "LEAK DET. KIT Protimeter MMS3 moisture meter BLD9800-C", assetNumber: "AST-0142" },
  { id: "02iJ5000001FXSxIAO", name: "Ladder 4.27mt Hook Roof Ladder", assetNumber: "AST-0143" },
  { id: "02iJ5000001FXSyIAO", name: "Ladder 4.0mt Triple Ladder", assetNumber: "AST-0144" },
  { id: "02iJ5000001FXSzIAO", name: "Ladder triple lyte ladder", assetNumber: "AST-0145" },
  { id: "02iJ5000001FXT0IAO", name: "LEAK DET. KIT Dry Roof Pro2 Kit", assetNumber: "AST-0146" },
  { id: "02iJ5000001FXT1IAO", name: "LEAK DET. KIT Inspection camera Ridgid CA-350X", assetNumber: "AST-0147" },
  { id: "02iJ5000001FXT2IAO", name: "LEAK DET. KIT Protimeter MMS2 moisture meter BLD8800", assetNumber: "AST-0148" },
  { id: "02iJ5000001FXT3IAO", name: "JSP Spartan 2 point fall arrest kit Roofing Harness (roofers only)", assetNumber: "AST-0149" },
  { id: "02iJ5000001FXT4IAO", name: "LEAK DET. KIT Thermal imaging camera TESTO 865", assetNumber: "AST-0150" },
  { id: "02iJ5000001FXT5IAO", name: "Ladder Back Support (2)", assetNumber: "AST-0151" },
  { id: "02iJ5000001FXT6IAO", name: "LEAK DET. KIT Protimeter MMS2 moisture meter BLD8800", assetNumber: "AST-0152" },
  { id: "02iJ5000001FXT7IAO", name: "LEAK DET. KIT Thermal imaging camera TESTO 865", assetNumber: "AST-0153" },
  { id: "02iJ5000001FXT8IAO", name: "Water Damage Master Kit", assetNumber: "AST-0154" },
  { id: "02iJ5000001FXT9IAO", name: "Ladder 1.60mt Step Ladder 6 Tread", assetNumber: "AST-0155" },
  { id: "02iJ5000001FXTAIA4", name: "Ladder 4.0mt Triple Ladder", assetNumber: "AST-0156" },
  { id: "02iJ5000001FXTBIA4", name: "Ladder Clamps RHINO YELLOW X2 NO KEYS", assetNumber: "AST-0157" },
  { id: "02iJ5000001FXTCIA4", name: "Ladder Top Support", assetNumber: "AST-0158" },
  { id: "02iJ5000001FXTDIA4", name: "LEAK DET. KIT BOC Gas Trolley", assetNumber: "AST-0159" },
  { id: "02iJ5000001FXTEIA4", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder", assetNumber: "AST-0160" },
  { id: "02iJ5000001FXTFIA4", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder Hose - RED with fixings", assetNumber: "AST-0161" },
  { id: "02iJ5000001FXTGIA4", name: "LEAK DET. KIT Inspection camera Ridgid CA-350X", assetNumber: "AST-0162" },
  { id: "02iJ5000001FXTHIA4", name: "Leak Detection Rothenberger R30 Pressure Pump", assetNumber: "AST-0163" },
  { id: "02iJ5000001FXTIIA4", name: "LEAK DET. KIT Primayer Prime trace RXG-890/EN YELLOW ONE", assetNumber: "AST-0164" },
  { id: "02iJ5000001FXTJIA4", name: "LEAK DET. KIT SEWERIN AQUAPHON A200 - ORANGE CASE", assetNumber: "AST-0165" },
  { id: "02iJ5000001FXTKIA4", name: "LEAK DET. KIT Protimeter analysis kit MMS2 BLD4900 small pack", assetNumber: "AST-0166" },
  { id: "02iJ5000001FXTLIA4", name: "LEAK DET. KIT Protimeter MMS2 moisture meter BLD8800", assetNumber: "AST-0167" },
  { id: "02iJ5000001FXTMIA4", name: "Radio Detection CAT4+ kit (inc Genny)", assetNumber: "AST-0168" },
  { id: "02iJ5000001FXTNIA4", name: "LEAK DET. KIT Thermal imaging camera TESTO 865", assetNumber: "AST-0169" },
  { id: "02iJ5000001FXTOIA4", name: "Ladder 1.70mt Step Ladder 6 Tread", assetNumber: "AST-0170" },
  { id: "02iJ5000001FXTPIA4", name: "Ridgid Flex Shaft K9 - 102", assetNumber: "AST-0171" },
  { id: "02iJ5000001FXTQIA4", name: "Ridgid Flex-Shaft K9 - 204", assetNumber: "AST-0172" },
  { id: "02iJ5000001FXTRIA4", name: "Drainage Scanprobe MAX PROBE 60 DVD CCTV Recorder and Reel YELLOW BOX REC & Locator", assetNumber: "AST-0173" },
  { id: "02iJ5000001FXTSIA4", name: "Drainage Scanprobe Trap Jumper", assetNumber: "AST-0174" },
  { id: "02iJ5000001FXTTIA4", name: "Drainage Scanprobe Trap Jumper", assetNumber: "AST-0175" },
  { id: "02iJ5000001FXTUIA4", name: "LEAK DET. KIT BOC gas regulator", assetNumber: "AST-0176" },
  { id: "02iJ5000001FXTVIA4", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder", assetNumber: "AST-0177" },
  { id: "02iJ5000001FXTWIA4", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder Hose - RED with fixings", assetNumber: "AST-0178" },
  { id: "02iJ5000001FXTXIA4", name: "LEAK DET. KIT Inspection camera Ridgid Ca-330", assetNumber: "AST-0179" },
  { id: "02iJ5000001FXTYIA4", name: "Leak Detection Rothenberger R30 Pressure Pump", assetNumber: "AST-0180" },
  { id: "02iJ5000001FXTZIA4", name: "LEAK DET. KIT Primayer Prime trace RXG-890/EN YELLOW ONE", assetNumber: "AST-0181" },
  { id: "02iJ5000001FXTaIAO", name: "LEAK DET. KIT SEWERIN AQUAPHON A200 - ORANGE CASE", assetNumber: "AST-0182" },
  { id: "02iJ5000001FXTbIAO", name: "LEAK DET. KIT Protimeter analysis kit MMS2 BLD4900 small pack", assetNumber: "AST-0183" },
  { id: "02iJ5000001FXTcIAO", name: "LEAK DET. KIT Protimeter MMS3 moisture meter BLD9800-C", assetNumber: "AST-0184" },
  { id: "02iJ5000001FXTdIAO", name: "LEAK DET. KIT Thermal imaging camera TESTO 865", assetNumber: "AST-0185" },
  { id: "02iJ5000001FXTeIAO", name: "Drainage Scanprobe MAX PROBE 60 DVD CCTV Recorder and Reel YELLOW BOX REC", assetNumber: "AST-0186" },
  { id: "02iJ5000001FXTfIAO", name: "Drainage Scanprobe Trap Jumper", assetNumber: "AST-0187" },
  { id: "02iJ5000001FXTgIAO", name: "LEAK DET. KIT Protimeter analysis kit MMS2 BLD4900 small pack", assetNumber: "AST-0188" },
  { id: "02iJ5000001FXThIAO", name: "Ridgid Flex-Shaft K9 - 102", assetNumber: "AST-0189" },
  { id: "02iJ5000001FXTiIAO", name: "Ridgid Flex-Shaft K9 - 204", assetNumber: "AST-0190" },
  { id: "02iJ5000001FXTjIAO", name: "JSP Spartan 2 point fall arrest kit Roofing Harness (roofers only)", assetNumber: "AST-0191" },
  { id: "02iJ5000001FXTkIAO", name: "LEAK DET. KIT SEWERIN AQUAPHON A200 - ORANGE CASE", assetNumber: "AST-0192" },
  { id: "02iJ5000001FXTlIAO", name: "LEAK DET. KIT Protimeter analysis kit MMS2 BLD4900 small pack", assetNumber: "AST-0193" },
  { id: "02iJ5000001FXTmIAO", name: "LEAK DET. KIT Protimeter MMS2 moisture meter BLD8800", assetNumber: "AST-0194" },
  { id: "02iJ5000001FXTnIAO", name: "Radio Detection CAT4+ kit (inc Genny)", assetNumber: "AST-0195" },
  { id: "02iJ5000001FXVLIA4", name: "LEAK DET. KIT Thermal imaging camera TESTO 865", assetNumber: "AST-0196" },
  { id: "02iJ5000001FXVMIA4", name: "LEAK DET. KIT BOC gas regulator", assetNumber: "AST-0197" },
  { id: "02iJ5000001FXVNIA4", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder", assetNumber: "AST-0198" },
  { id: "02iJ5000001FXVOIA4", name: "LEAK DET. KIT BOC Hydrogen/Nitrogen cylinder Hose - RED with fixings", assetNumber: "AST-0199" },
  { id: "02iJ5000001FXVPIA4", name: "Ladder Clamps (pair)", assetNumber: "AST-0200" },
].sort((a, b) => a.name.localeCompare(b.name));

// Fallback list of common/local asset types (local IDs prefixed with LOCAL::)
const DEFAULT_ASSET_TYPES: {id: string; name: string}[] = [
  'Ladder','Pump','Valve','Motor','Tool','Safety Equipment','Dehumidifier','Vacuum Cleaner',
  'Generator','Compressor','Transformer','Lawn Mower','Drill','Saw','Inspection Camera','Thermal Camera',
  'Leak Detection Kit','Carpet Cleaner','Sub Pump','Hand Tool','Power Tool','Battery Pack','Charger',
  'Sensor','Router','Switch','Laptop','Tablet','Mobile Phone','Protective Clothing','Gloves','Boots',
  'Hard Hat','Fire Extinguisher','First Aid Kit','Trolley','Gas Regulator','Cylinder','Pump Hose','Hose Reel',
  'Pump Assembly','Metering Device','Pressure Gauge','Flow Meter','Heater','Air Conditioner','Fan','Filter'
].map((n) => ({ id: `LOCAL::${n}`, name: n }));

const Upload = () => {
  const navigate = useNavigate();

  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [assetPrice, setAssetPrice] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assetTypes, setAssetTypes] = useState<{id: string; name: string}[]>([]);
  const [selectedAssetType, setSelectedAssetType] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEngineers = useMemo(() => {
    return ENGINEERS.filter(eng => 
      eng.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      eng.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredAssets = useMemo(() => {
    return ASSETS.filter(asset => 
      asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
      asset.assetNumber.toLowerCase().includes(assetSearchTerm.toLowerCase())
    );
  }, [assetSearchTerm]);

  const selectedAsset = useMemo(() => {
    return ASSETS.find(a => a.id === selectedAssetId);
  }, [selectedAssetId]);

  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const res = await fetch('https://aivison-3.onrender.com/get-asset-types');
        const json = await res.json();
        if (json && json.success && Array.isArray(json.asset_types)) {
          const fetched: {id:string;name:string}[] = json.asset_types;
          const names = new Set(fetched.map(f => f.name.toLowerCase()));
          const merged = [...fetched, ...DEFAULT_ASSET_TYPES.filter(d => !names.has(d.name.toLowerCase()))];
          setAssetTypes(merged);
          return;
        }
        setAssetTypes(DEFAULT_ASSET_TYPES);
      } catch (err) {
        console.error('Failed to load asset types', err);
        setAssetTypes(DEFAULT_ASSET_TYPES);
      }
    };
    fetchAssetTypes();
  }, []);

  const handleAssetTypeChange = async (value: string) => {
    if (!value.startsWith('LOCAL::')) {
      setSelectedAssetType(value);
      return;
    }
    const localName = value.replace('LOCAL::', '');
    const mapped = assetTypes.find(
      (t) => !t.id.startsWith('LOCAL::') && t.name.toLowerCase() === localName.toLowerCase()
    );
    if (mapped) {
      setSelectedAssetType(mapped.id);
      return;
    }
    // Create in Salesforce via backend
    try {
      const resp = await fetch('https://aivison-3.onrender.com/create-asset-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: localName })
      });
      const j = await resp.json();
      if (j && j.success && j.id) {
        setSelectedAssetType(j.id);
        setAssetTypes(prev => [{ id: j.id, name: localName }, ...prev]);
        return;
      }
    } catch (e) {
      console.error('Failed to create asset type', e);
    }
    // fallback to local value
    setSelectedAssetType(value);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be less than 20MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    const engineer = ENGINEERS.find(e => e.id === selectedEngineerId);
    
    if (!engineer || !imageFile || !assetPrice || !selectedAssetId) {
      toast.error('Please complete all fields, including asset and price');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('engineer_id', engineer.id);
      formData.append('engineer_name', engineer.name);
      formData.append('asset_price', assetPrice);
      formData.append('asset_id', selectedAssetId);
      formData.append('asset_name', selectedAsset?.name || '');
      formData.append('asset_number', selectedAsset?.assetNumber || '');
      formData.append('serial_number', serialNumber);
      formData.append('purchase_date', purchaseDate);
      // CRITICAL FIX: Send Asset Type ID (REQUIRED by Salesforce)
      formData.append('asset_type', selectedAssetType);

      // Send account_id (empty = uses DEFAULT_ASSET_ACCOUNT_ID from .env)
      formData.append('account_id', '');

      const response = await fetch('https://aivison-3.onrender.com/upload-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to analyze or save asset.');
        console.error('Server response:', result);
        setLoading(false);
        return;
      }

      // Show detailed status based on Salesforce sync
      if (result.salesforce_status === 'created') {
        toast.success(`Asset saved successfully! Salesforce ID: ${result.salesforce_id}`);
      } else if (result.salesforce_status === 'skipped') {
        toast.warning(`Asset saved locally only. Reason: ${result.salesforce_error}`);
      } else if (result.salesforce_status === 'failed') {
        toast.warning(`Asset saved locally, but Salesforce sync failed. Error: ${result.salesforce_error}`);
      } else {
        toast.success('Asset analyzed & saved successfully!');
      }

      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-64 bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/10">
                <UploadIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Asset Management System</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')} className="text-white border-white/20 hover:bg-white/10">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
          <p className="text-lg text-slate-300">AI-powered asset identification and tracking</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto shadow-lg border-none">
          <CardHeader>
            <CardTitle>Asset Registration</CardTitle>
            <CardDescription>
              Select engineer ({ENGINEERS.length} total), asset (ID: 02i...), upload photo, and set valuation. Total assets: {ASSETS.length}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ENGINEER SEARCH & SELECT */}
            <div className="space-y-2">
              <Label>Engineer Name & ID ({ENGINEERS.length} engineers)</Label>
              <div className="relative mb-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search name or ID..." 
                    className="pl-8 text-sm" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Select value={selectedEngineerId} onValueChange={setSelectedEngineerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Engineer" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredEngineers.map((eng) => (
                    <SelectItem key={eng.id} value={eng.id}>
                      <div className="flex flex-col">
                        <span>{eng.name}</span>
                        <span className="text-[10px] text-muted-foreground">{eng.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ASSET SEARCH & SELECT WITH CORRECT 02i ID */}
            <div className="space-y-2">
              <Label>Asset (ID starts with 02i)</Label>
              <div className="relative mb-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search asset name, ID (02i...), or AST number..." 
                    className="pl-8 text-sm" 
                    value={assetSearchTerm}
                    onChange={(e) => setAssetSearchTerm(e.target.value)}
                  />
              </div>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Asset" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{asset.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {asset.assetNumber} | {asset.id}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

              {/* ASSET TYPE SELECT */}
              <div className="space-y-2">
                <Label>Asset Type (Salesforce)</Label>
                <Select value={selectedAssetType} onValueChange={handleAssetTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Asset Type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {assetTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-[10px] text-muted-foreground">{t.id}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input placeholder="Enter serial number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
              </div>
            </div>

            {/* IMAGE UPLOAD AREA */}
            <div className="space-y-2">
              <Label>Asset Visual</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition-all bg-slate-50/50"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-md shadow-sm border" />
                ) : (
                  <div className="space-y-2 py-4">
                    <UploadIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Click to upload image (Max 20MB)</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>
            </div>

            {/* MANUAL PRICE ENTRY FIELD */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label htmlFor="asset-price" className="text-blue-700 font-bold">Manual Asset Valuation</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="asset-price"
                  type="number" 
                  step="0.01"
                  placeholder="Enter estimated value (e.g. 150.00)" 
                  className="pl-9 h-11 text-lg font-semibold"
                  value={assetPrice}
                  onChange={(e) => setAssetPrice(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-slate-400">This valuation will be used on the Portfolio and Dashboard summaries.</p>
            </div>

            <Button
              onClick={handleAnalyze}
              className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
              disabled={loading || !selectedEngineerId || !selectedAssetId || !imageFile || !assetPrice || !selectedAssetType}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing & Registering...</>
              ) : (
                <><UploadIcon className="mr-2 h-5 w-5" /> Analyze & Register Asset</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
