update products
set image_url = case slug
  when 'canada-car-flag' then '/asset/images/canada-car-flag.jpg'
  when 'brazil-car-flag' then '/asset/images/brazil-car-flag.jpg'
  when 'argentina-car-flag' then '/asset/images/argentina-car-flag.jpg'
  when 'france-car-flag' then '/asset/images/france-car-flag.jpg'
  when 'germany-car-flag' then '/asset/images/germany-car-flag.jpg'
  when 'ghana-car-flag' then '/asset/images/ghana-car-flag.jpg'
  when 'italy-car-flag' then '/asset/images/italy-car-flag.jpg'
  when 'mexico-car-flag' then '/asset/images/mexico-car-flag.jpg'
  when 'morocco-car-flag' then '/asset/images/morocco-car-flag.jpg'
  when 'nigeria-car-flag' then '/asset/images/nigeria-car-flag.jpg'
  when 'portugal-car-flag' then '/asset/images/portugal-car-flag.jpg'
  when 'south-korea-car-flag' then '/asset/images/south-korea-car-flag.jpg'
  when 'spain-car-flag' then '/asset/images/spain-car-flag.jpg'
  when 'turkey-car-flag' then '/asset/images/turkey-car-flag.jpg'
  when 'ukraine-car-flag' then '/asset/images/ukraine-car-flag.jpg'
  when 'united-states-car-flag' then '/asset/images/united-states-car-flag.jpg'
  when 'japan-flag-3d-embroidered-cap' then '/asset/images/japan-flag-3d-embroidered-cap.jpg'
  when 'bulgaria-flag-3d-embroidered-cap' then '/asset/images/bulgaria-flag-3d-embroidered-cap.jpg'
  when 'morocco-flag-3d-embroidered-cap' then '/asset/images/morocco-flag-3d-embroidered-cap.jpg'
  when 'netherlands-flag-3d-embroidered-cap' then '/asset/images/netherlands-flag-3d-embroidered-cap.jpg'
  else image_url
end
where slug in (
  'canada-car-flag',
  'brazil-car-flag',
  'argentina-car-flag',
  'france-car-flag',
  'germany-car-flag',
  'ghana-car-flag',
  'italy-car-flag',
  'mexico-car-flag',
  'morocco-car-flag',
  'nigeria-car-flag',
  'portugal-car-flag',
  'south-korea-car-flag',
  'spain-car-flag',
  'turkey-car-flag',
  'ukraine-car-flag',
  'united-states-car-flag',
  'japan-flag-3d-embroidered-cap',
  'bulgaria-flag-3d-embroidered-cap',
  'morocco-flag-3d-embroidered-cap',
  'netherlands-flag-3d-embroidered-cap'
);
