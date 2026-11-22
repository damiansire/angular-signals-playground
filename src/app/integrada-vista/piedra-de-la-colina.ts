/**
 * The stone at the edge of the hill, where Angie sits to think, drawn in her same 1080 square: its
 * top edge is at y = 790, at her hips. The hill draws it, and so does Angie's little planet in the
 * notice: at the end of the fall the planet's stone lands exactly on the hill's, so both must be the
 * same drawing.
 */
export const SOMBRA_DE_LA_PIEDRA = {
  cx: 575,
  cy: 1000,
  rx: 320,
  ry: 30,
  fill: 'rgba(30, 60, 45, 0.3)',
} as const;

export const PIEDRA_DE_LA_COLINA: readonly { readonly fill: string; readonly d: string }[] = [
  {
    fill: '#737c87',
    d: 'M282 994C262 930 276 830 334 794C400 766 500 760 570 760C660 760 764 768 816 802C868 838 880 930 866 996C710 1016 440 1016 282 994Z',
  },
  {
    fill: '#929ba5',
    d: 'M300 972C290 906 304 832 346 802C420 790 500 788 570 788C660 788 752 794 806 814C846 846 854 920 846 976C694 992 452 992 300 972Z',
  },
  {
    fill: '#b9c0c6',
    d: 'M340 794C400 770 500 763 570 763C660 763 760 771 808 802C760 792 660 788 570 788C480 788 400 790 340 794Z',
  },
  { fill: '#6a737d', d: 'M718 880C760 876 800 894 812 930C778 912 746 902 718 880Z' },
  { fill: '#6a737d', d: 'M360 916C384 940 416 954 452 956C414 964 378 950 360 916Z' },
  {
    fill: '#5aab89',
    d: 'M340 796C376 774 418 768 452 772C428 782 402 788 382 800C366 810 348 810 340 796Z',
  },
  {
    fill: '#4fa07f',
    d: 'M272 1002C282 978 294 968 300 988C308 966 320 964 322 990C332 974 344 976 342 1004Z',
  },
  {
    fill: '#4fa07f',
    d: 'M820 1002C828 980 840 972 846 992C854 972 866 970 868 996C876 982 886 986 882 1006Z',
  },
];
