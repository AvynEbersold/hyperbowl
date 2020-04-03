//jshint esversion: 9

const numberOfPossibleBanners = 5;
const bannerAlert = Math.floor(Math.random() * numberOfPossibleBanners);

document.write("Hint: ");
switch (bannerAlert) {
  case 0:
    document.write("<a class='light-link' href='/feedback'>Give us feedback</a> if you find an issue.");
    break;
  case 1:
    document.write("Go to your <a class='light-link' href='/settings'>Settings</a> to customize Hyperbowl.");
    break;
  case 2:
    document.write("You can message someone by going to <a class='light-link' href='/messages'>Messages</a>.");
    break;
  case 3:
    document.write("You can change your profile description. Go to your profile by selecting it from the dropdown.");
    break;
  case 4:
    document.write("You can support Hyperbowl by turning off your ad blocker.");
    break;
}
